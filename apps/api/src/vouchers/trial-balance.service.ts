import { Injectable, NotFoundException } from '@nestjs/common';
import { FixedAccount, Prisma, VoucherSourceType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ACCOUNT_MAPPING, CHART_OF_ACCOUNTS } from './chart-of-accounts';
import { ACCOUNT_LABELS, SOURCE_LABELS } from './labels';

export interface TrialBalanceItem {
  code: string;
  name: string;
  level: 'GROUP' | 'KOL' | 'MOEIN' | 'DETAIL';
  fixedAccount?: FixedAccount;
  parentCode?: string;
  // 4-Column Fields (گردش و مانده نهایی)
  debitTurn: number;
  creditTurn: number;
  debitBalance: number;
  creditBalance: number;
  // 8-Column Detailed Fields (ابتدای دوره، طی دوره، گردش کل، مانده پایان دوره)
  openingDebitBalance: number;
  openingCreditBalance: number;
  periodDebit: number;
  periodCredit: number;
  cumulativeDebit: number;
  cumulativeCredit: number;
  closingDebitBalance: number;
  closingCreditBalance: number;
}

export interface CustomerDetailItem {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  debitTurn: number;
  creditTurn: number;
  debitBalance: number;
  creditBalance: number;
  openingDebitBalance: number;
  openingCreditBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingDebitBalance: number;
  closingCreditBalance: number;
}

export interface TrialBalanceReport {
  generatedAt: Date;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  isBalanced: boolean;
  totals: {
    // 4 ستونی
    totalDebitTurn: number;
    totalCreditTurn: number;
    totalDebitBalance: number;
    totalCreditBalance: number;
    // 8 ستونی
    totalOpeningDebitBalance: number;
    totalOpeningCreditBalance: number;
    totalPeriodDebit: number;
    totalPeriodCredit: number;
    totalCumulativeDebit: number;
    totalCumulativeCredit: number;
    totalClosingDebitBalance: number;
    totalClosingCreditBalance: number;
  };
  groups: TrialBalanceItem[];
  kols: TrialBalanceItem[];
  moeins: TrialBalanceItem[];
  customerDetails?: CustomerDetailItem[];
}

export interface GeneralLedgerEntry {
  lineId: string;
  voucherId: string;
  voucherNumber: number;
  date: Date;
  sourceType: VoucherSourceType;
  sourceLabel: string;
  sourceId: string;
  note: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
  counterparty: {
    kind: 'CUSTOMER' | 'SUPPLIER';
    id: string;
    name: string;
  } | null;
}

export interface GeneralLedgerReport {
  account: FixedAccount;
  accountInfo: {
    code: string;
    name: string;
    kolCode: string;
    kolName: string;
    groupCode: string;
    groupName: string;
    nature: string;
  };
  filter: {
    from: string | null;
    to: string | null;
    customerId?: string;
  };
  openingBalance: {
    amount: number;
    debit: number;
    credit: number;
  };
  periodTotals: {
    debit: number;
    credit: number;
  };
  closingBalance: {
    amount: number;
    debit: number;
    credit: number;
  };
  entries: GeneralLedgerEntry[];
}

@Injectable()
export class TrialBalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * محاسبه تراز آزمایشی ۴ و ۸ ستونی استاندارد حسابداری ایران
   */
  async getTrialBalance(params: {
    from?: string;
    to?: string;
    includeZero?: boolean;
    includeCustomerDetails?: boolean;
  }): Promise<TrialBalanceReport> {
    const fromDate = params.from ? new Date(params.from) : null;
    const toDate = params.to ? new Date(params.to) : null;
    const includeZero = params.includeZero ?? false;
    const includeCustomerDetails = params.includeCustomerDetails ?? true;

    // ۱. استخراج کلیه خطوط سند به همراه تاریخ سند
    const lines = await this.prisma.voucherLine.findMany({
      select: {
        id: true,
        account: true,
        amount: true,
        customerId: true,
        voucher: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    // تفکیک خطوط به قبل از دوره (ابتدای دوره) و طی دوره
    const accounts = Object.keys(ACCOUNT_MAPPING) as FixedAccount[];

    // داده‌های تجمیعی هر حساب معین
    const moeinData: Record<
      FixedAccount,
      {
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
      }
    > = {} as any;

    for (const acc of accounts) {
      moeinData[acc] = {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
      };
    }

    // تجمیعی مشتریان (برای حساب CUSTOMERS)
    const customerAgg: Record<
      string,
      {
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
      }
    > = {};

    for (const l of lines) {
      const vDate = l.voucher.createdAt;
      const isOpening = fromDate && vDate < fromDate;
      const isInPeriod =
        (!fromDate || vDate >= fromDate) && (!toDate || vDate <= toDate);

      const debit = l.amount > 0 ? l.amount : 0;
      const credit = l.amount < 0 ? -l.amount : 0;

      if (!moeinData[l.account]) {
        moeinData[l.account] = {
          openingDebit: 0,
          openingCredit: 0,
          periodDebit: 0,
          periodCredit: 0,
        };
      }

      if (isOpening) {
        moeinData[l.account].openingDebit += debit;
        moeinData[l.account].openingCredit += credit;

        if (l.customerId && l.account === FixedAccount.CUSTOMERS) {
          if (!customerAgg[l.customerId]) {
            customerAgg[l.customerId] = {
              openingDebit: 0,
              openingCredit: 0,
              periodDebit: 0,
              periodCredit: 0,
            };
          }
          customerAgg[l.customerId].openingDebit += debit;
          customerAgg[l.customerId].openingCredit += credit;
        }
      } else if (isInPeriod) {
        moeinData[l.account].periodDebit += debit;
        moeinData[l.account].periodCredit += credit;

        if (l.customerId && l.account === FixedAccount.CUSTOMERS) {
          if (!customerAgg[l.customerId]) {
            customerAgg[l.customerId] = {
              openingDebit: 0,
              openingCredit: 0,
              periodDebit: 0,
              periodCredit: 0,
            };
          }
          customerAgg[l.customerId].periodDebit += debit;
          customerAgg[l.customerId].periodCredit += credit;
        }
      }
    }

    // ساخت ردیف‌های معین
    const moeins: TrialBalanceItem[] = [];

    for (const acc of accounts) {
      const meta = ACCOUNT_MAPPING[acc];
      const d = moeinData[acc];

      const openingNet = d.openingDebit - d.openingCredit;
      const openingDebitBal = openingNet > 0 ? openingNet : 0;
      const openingCreditBal = openingNet < 0 ? Math.abs(openingNet) : 0;

      const cumulativeDebit = d.openingDebit + d.periodDebit;
      const cumulativeCredit = d.openingCredit + d.periodCredit;

      const closingNet = cumulativeDebit - cumulativeCredit;
      const closingDebitBal = closingNet > 0 ? closingNet : 0;
      const closingCreditBal = closingNet < 0 ? Math.abs(closingNet) : 0;

      const hasActivity =
        d.openingDebit > 0 ||
        d.openingCredit > 0 ||
        d.periodDebit > 0 ||
        d.periodCredit > 0;

      if (!includeZero && !hasActivity) continue;

      moeins.push({
        code: meta.moeinCode,
        name: meta.moeinName,
        level: 'MOEIN',
        fixedAccount: acc,
        parentCode: meta.kolCode,
        debitTurn: cumulativeDebit,
        creditTurn: cumulativeCredit,
        debitBalance: closingDebitBal,
        creditBalance: closingCreditBal,
        openingDebitBalance: openingDebitBal,
        openingCreditBalance: openingCreditBal,
        periodDebit: d.periodDebit,
        periodCredit: d.periodCredit,
        cumulativeDebit,
        cumulativeCredit,
        closingDebitBalance: closingDebitBal,
        closingCreditBalance: closingCreditBal,
      });
    }

    // تجمیع سطوح کل (Kol)
    const kolMap = new Map<string, TrialBalanceItem>();

    for (const m of moeins) {
      const meta = ACCOUNT_MAPPING[m.fixedAccount!];
      const kolCode = meta.kolCode;

      if (!kolMap.has(kolCode)) {
        kolMap.set(kolCode, {
          code: kolCode,
          name: meta.kolName,
          level: 'KOL',
          parentCode: meta.groupCode,
          debitTurn: 0,
          creditTurn: 0,
          debitBalance: 0,
          creditBalance: 0,
          openingDebitBalance: 0,
          openingCreditBalance: 0,
          periodDebit: 0,
          periodCredit: 0,
          cumulativeDebit: 0,
          cumulativeCredit: 0,
          closingDebitBalance: 0,
          closingCreditBalance: 0,
        });
      }

      const kol = kolMap.get(kolCode)!;
      kol.openingDebitBalance += m.openingDebitBalance;
      kol.openingCreditBalance += m.openingCreditBalance;
      kol.periodDebit += m.periodDebit;
      kol.periodCredit += m.periodCredit;
      kol.cumulativeDebit += m.cumulativeDebit;
      kol.cumulativeCredit += m.cumulativeCredit;
      kol.closingDebitBalance += m.closingDebitBalance;
      kol.closingCreditBalance += m.closingCreditBalance;
      kol.debitTurn += m.debitTurn;
      kol.creditTurn += m.creditTurn;
      kol.debitBalance += m.debitBalance;
      kol.creditBalance += m.creditBalance;
    }

    const kols = Array.from(kolMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );

    // تجمیع سطوح گروه (Group)
    const groupMap = new Map<string, TrialBalanceItem>();

    for (const k of kols) {
      const groupCode = k.parentCode!;
      const groupDef = CHART_OF_ACCOUNTS.find((g) => g.groupCode === groupCode);
      const groupName = groupDef ? groupDef.groupName : `گروه ${groupCode}`;

      if (!groupMap.has(groupCode)) {
        groupMap.set(groupCode, {
          code: groupCode,
          name: groupName,
          level: 'GROUP',
          debitTurn: 0,
          creditTurn: 0,
          debitBalance: 0,
          creditBalance: 0,
          openingDebitBalance: 0,
          openingCreditBalance: 0,
          periodDebit: 0,
          periodCredit: 0,
          cumulativeDebit: 0,
          cumulativeCredit: 0,
          closingDebitBalance: 0,
          closingCreditBalance: 0,
        });
      }

      const grp = groupMap.get(groupCode)!;
      grp.openingDebitBalance += k.openingDebitBalance;
      grp.openingCreditBalance += k.openingCreditBalance;
      grp.periodDebit += k.periodDebit;
      grp.periodCredit += k.periodCredit;
      grp.cumulativeDebit += k.cumulativeDebit;
      grp.cumulativeCredit += k.cumulativeCredit;
      grp.closingDebitBalance += k.closingDebitBalance;
      grp.closingCreditBalance += k.closingCreditBalance;
      grp.debitTurn += k.debitTurn;
      grp.creditTurn += k.creditTurn;
      grp.debitBalance += k.debitBalance;
      grp.creditBalance += k.creditBalance;
    }

    const groups = Array.from(groupMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );

    // تفصیلی مشتریان
    let customerDetails: CustomerDetailItem[] | undefined = undefined;
    if (includeCustomerDetails && Object.keys(customerAgg).length > 0) {
      const custIds = Object.keys(customerAgg);
      const dbCusts = await this.prisma.customer.findMany({
        where: { id: { in: custIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phones: { select: { phone: true }, take: 1 },
        },
      });
      const custNameMap = new Map(
        dbCusts.map((c) => [
          c.id,
          {
            name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'بی‌نام',
            phone: c.phones[0]?.phone ?? null,
          },
        ]),
      );

      customerDetails = custIds.map((cid) => {
        const d = customerAgg[cid];
        const cInfo = custNameMap.get(cid);

        const opNet = d.openingDebit - d.openingCredit;
        const opDebBal = opNet > 0 ? opNet : 0;
        const opCrdBal = opNet < 0 ? Math.abs(opNet) : 0;

        const cumDeb = d.openingDebit + d.periodDebit;
        const cumCrd = d.openingCredit + d.periodCredit;

        const clNet = cumDeb - cumCrd;
        const clDebBal = clNet > 0 ? clNet : 0;
        const clCrdBal = clNet < 0 ? Math.abs(clNet) : 0;

        return {
          customerId: cid,
          customerName: cInfo?.name || cid,
          customerPhone: cInfo?.phone,
          debitTurn: cumDeb,
          creditTurn: cumCrd,
          debitBalance: clDebBal,
          creditBalance: clCrdBal,
          openingDebitBalance: opDebBal,
          openingCreditBalance: opCrdBal,
          periodDebit: d.periodDebit,
          periodCredit: d.periodCredit,
          closingDebitBalance: clDebBal,
          closingCreditBalance: clCrdBal,
        };
      });

      customerDetails.sort((a, b) => b.closingDebitBalance - a.closingDebitBalance);
    }

    // مجموع کل
    let totalDebitTurn = 0;
    let totalCreditTurn = 0;
    let totalDebitBalance = 0;
    let totalCreditBalance = 0;

    let totalOpeningDebitBalance = 0;
    let totalOpeningCreditBalance = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalCumulativeDebit = 0;
    let totalCumulativeCredit = 0;
    let totalClosingDebitBalance = 0;
    let totalClosingCreditBalance = 0;

    for (const m of moeins) {
      totalDebitTurn += m.debitTurn;
      totalCreditTurn += m.creditTurn;
      totalDebitBalance += m.debitBalance;
      totalCreditBalance += m.creditBalance;

      totalOpeningDebitBalance += m.openingDebitBalance;
      totalOpeningCreditBalance += m.openingCreditBalance;
      totalPeriodDebit += m.periodDebit;
      totalPeriodCredit += m.periodCredit;
      totalCumulativeDebit += m.cumulativeDebit;
      totalCumulativeCredit += m.cumulativeCredit;
      totalClosingDebitBalance += m.closingDebitBalance;
      totalClosingCreditBalance += m.closingCreditBalance;
    }

    const isBalanced =
      Math.abs(totalClosingDebitBalance - totalClosingCreditBalance) < 1 &&
      Math.abs(totalPeriodDebit - totalPeriodCredit) < 1;

    return {
      generatedAt: new Date(),
      dateRange: {
        from: params.from ?? null,
        to: params.to ?? null,
      },
      isBalanced,
      totals: {
        totalDebitTurn,
        totalCreditTurn,
        totalDebitBalance,
        totalCreditBalance,
        totalOpeningDebitBalance,
        totalOpeningCreditBalance,
        totalPeriodDebit,
        totalPeriodCredit,
        totalCumulativeDebit,
        totalCumulativeCredit,
        totalClosingDebitBalance,
        totalClosingCreditBalance,
      },
      groups,
      kols,
      moeins,
      customerDetails,
    };
  }

  /**
   * گزارش دفتر کل / دفتر معین به همراه مانده شناور برای یک حساب
   */
  async getGeneralLedger(
    account: FixedAccount,
    params: {
      from?: string;
      to?: string;
      customerId?: string;
    },
  ): Promise<GeneralLedgerReport> {
    const meta = ACCOUNT_MAPPING[account];
    if (!meta) {
      throw new NotFoundException(`حساب ${account} تعریف نشده است`);
    }

    const fromDate = params.from ? new Date(params.from) : null;
    const toDate = params.to ? new Date(params.to) : null;

    // ۱. محاسبه مانده ابتدای دوره (قبل از from)
    let openingAmount = 0;
    if (fromDate) {
      const whereBefore: Prisma.VoucherLineWhereInput = {
        account,
        voucher: {
          createdAt: { lt: fromDate },
        },
      };
      if (params.customerId && account === FixedAccount.CUSTOMERS) {
        whereBefore.customerId = params.customerId;
      }

      const beforeLines = await this.prisma.voucherLine.findMany({
        where: whereBefore,
        select: { amount: true },
      });

      openingAmount = beforeLines.reduce((acc, l) => acc + l.amount, 0);
    }

    // ۲. دریافت گردش‌های طی دوره
    const wherePeriod: Prisma.VoucherLineWhereInput = {
      account,
      voucher: {
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },
    };
    if (params.customerId && account === FixedAccount.CUSTOMERS) {
      wherePeriod.customerId = params.customerId;
    }

    const periodLines = await this.prisma.voucherLine.findMany({
      where: wherePeriod,
      include: {
        voucher: {
          select: {
            id: true,
            number: true,
            sourceType: true,
            sourceId: true,
            createdAt: true,
            note: true,
          },
        },
      },
      orderBy: {
        voucher: {
          createdAt: 'asc',
        },
      },
    });

    // استخراج طرف حساب‌ها
    const custIds = [
      ...new Set(
        periodLines.map((l) => l.customerId).filter((id): id is string => !!id),
      ),
    ];
    const purchaseSourceIds = periodLines
      .filter(
        (l) =>
          l.voucher.sourceType === VoucherSourceType.PURCHASE_INVOICE ||
          l.voucher.sourceType === VoucherSourceType.PURCHASE_CANCEL,
      )
      .map((l) => l.voucher.sourceId);

    const [customers, purchases] = await Promise.all([
      custIds.length
        ? this.prisma.customer.findMany({
            where: { id: { in: custIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : Promise.resolve([]),
      purchaseSourceIds.length
        ? this.prisma.purchaseInvoice.findMany({
            where: { id: { in: purchaseSourceIds } },
            select: { id: true, supplier: { select: { id: true, name: true } } },
          })
        : Promise.resolve([]),
    ]);

    const custNameMap = new Map(
      customers.map((c) => [
        c.id,
        [c.firstName, c.lastName].filter(Boolean).join(' '),
      ]),
    );
    const supplierByPurchase = new Map(purchases.map((p) => [p.id, p.supplier]));

    // محاسبه مانده شناور و ساخت اقلام دفتر
    let currentBalance = openingAmount;
    let periodDebit = 0;
    let periodCredit = 0;

    const entries: GeneralLedgerEntry[] = periodLines.map((l) => {
      const debit = l.amount > 0 ? l.amount : 0;
      const credit = l.amount < 0 ? -l.amount : 0;
      periodDebit += debit;
      periodCredit += credit;
      currentBalance += l.amount;

      const supplier = supplierByPurchase.get(l.voucher.sourceId);
      const custName = l.customerId ? custNameMap.get(l.customerId) : null;

      let counterparty: GeneralLedgerEntry['counterparty'] = null;
      if (supplier) {
        counterparty = {
          kind: 'SUPPLIER',
          id: supplier.id,
          name: supplier.name,
        };
      } else if (l.customerId && custName) {
        counterparty = {
          kind: 'CUSTOMER',
          id: l.customerId,
          name: custName,
        };
      }

      return {
        lineId: l.id,
        voucherId: l.voucher.id,
        voucherNumber: l.voucher.number,
        date: l.voucher.createdAt,
        sourceType: l.voucher.sourceType,
        sourceLabel: SOURCE_LABELS[l.voucher.sourceType] ?? l.voucher.sourceType,
        sourceId: l.voucher.sourceId,
        note: l.note || l.voucher.note,
        debit,
        credit,
        runningBalance: currentBalance,
        counterparty,
      };
    });

    const opDebit = openingAmount > 0 ? openingAmount : 0;
    const opCredit = openingAmount < 0 ? -openingAmount : 0;
    const clDebit = currentBalance > 0 ? currentBalance : 0;
    const clCredit = currentBalance < 0 ? -currentBalance : 0;

    return {
      account,
      accountInfo: {
        code: meta.moeinCode,
        name: meta.moeinName,
        kolCode: meta.kolCode,
        kolName: meta.kolName,
        groupCode: meta.groupCode,
        groupName: meta.groupName,
        nature: meta.nature,
      },
      filter: {
        from: params.from ?? null,
        to: params.to ?? null,
        customerId: params.customerId,
      },
      openingBalance: {
        amount: openingAmount,
        debit: opDebit,
        credit: opCredit,
      },
      periodTotals: {
        debit: periodDebit,
        credit: periodCredit,
      },
      closingBalance: {
        amount: currentBalance,
        debit: clDebit,
        credit: clCredit,
      },
      entries,
    };
  }

  /**
   * دریافت ساختار استاندارد کدینگ حساب‌ها
   */
  getChartOfAccounts() {
    return {
      groups: CHART_OF_ACCOUNTS,
      mapping: ACCOUNT_MAPPING,
    };
  }
}
