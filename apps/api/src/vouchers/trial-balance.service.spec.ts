import { Test, TestingModule } from '@nestjs/testing';
import { FixedAccount, VoucherSourceType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TrialBalanceService } from './trial-balance.service';

describe('TrialBalanceService', () => {
  let service: TrialBalanceService;

  const mockLines = [
    // سند ۱: فروش نقد و نسیه (تاریخ: 2026-01-10)
    // بدهکار: صندوق 50,000 | بدهکار: مشتری 150,000 | بستانکار: فروش 200,000
    {
      id: 'l1',
      account: FixedAccount.CASH,
      amount: 50000,
      customerId: null,
      voucher: {
        id: 'v1',
        number: 1,
        sourceType: VoucherSourceType.SALE_INVOICE,
        sourceId: 'inv-1',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        note: 'فروش به مشتری الف',
      },
    },
    {
      id: 'l2',
      account: FixedAccount.CUSTOMERS,
      amount: 150000,
      customerId: 'cust-1',
      voucher: {
        id: 'v1',
        number: 1,
        sourceType: VoucherSourceType.SALE_INVOICE,
        sourceId: 'inv-1',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        note: 'فروش به مشتری الف',
      },
    },
    {
      id: 'l3',
      account: FixedAccount.SALES,
      amount: -200000,
      customerId: null,
      voucher: {
        id: 'v1',
        number: 1,
        sourceType: VoucherSourceType.SALE_INVOICE,
        sourceId: 'inv-1',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        note: 'فروش به مشتری الف',
      },
    },

    // سند ۲: بهای تمام‌شده و خروج از انبار سند ۱ (تاریخ: 2026-01-10)
    // بدهکار: بهای تمام‌شده 120,000 | بستانکار: انبار 120,000
    {
      id: 'l4',
      account: FixedAccount.COGS,
      amount: 120000,
      customerId: null,
      voucher: {
        id: 'v2',
        number: 2,
        sourceType: VoucherSourceType.SALE_INVOICE,
        sourceId: 'inv-1',
        createdAt: new Date('2026-01-10T10:05:00Z'),
        note: 'خروج انبار فاکتور ۱',
      },
    },
    {
      id: 'l5',
      account: FixedAccount.INVENTORY,
      amount: -120000,
      customerId: null,
      voucher: {
        id: 'v2',
        number: 2,
        sourceType: VoucherSourceType.SALE_INVOICE,
        sourceId: 'inv-1',
        createdAt: new Date('2026-01-10T10:05:00Z'),
        note: 'خروج انبار فاکتور ۱',
      },
    },

    // سند ۳: دریافت وجه از مشتری به بانک (تاریخ: 2026-02-15)
    // بدهکار: بانک 100,000 | بستانکار: مشتری 100,000
    {
      id: 'l6',
      account: FixedAccount.BANK,
      amount: 100000,
      customerId: null,
      voucher: {
        id: 'v3',
        number: 3,
        sourceType: VoucherSourceType.RECEIPT,
        sourceId: 'rec-1',
        createdAt: new Date('2026-02-15T12:00:00Z'),
        note: 'تسویه بدهی مشتری الف',
      },
    },
    {
      id: 'l7',
      account: FixedAccount.CUSTOMERS,
      amount: -100000,
      customerId: 'cust-1',
      voucher: {
        id: 'v3',
        number: 3,
        sourceType: VoucherSourceType.RECEIPT,
        sourceId: 'rec-1',
        createdAt: new Date('2026-02-15T12:00:00Z'),
        note: 'تسویه بدهی مشتری الف',
      },
    },
  ];

  const mockCustomers = [
    {
      id: 'cust-1',
      firstName: 'علی',
      lastName: 'رضایی',
      phones: [{ phone: '09123456789' }],
    },
  ];

  const mockPrisma = {
    voucherLine: {
      findMany: jest.fn().mockImplementation((args?: any) => {
        if (!args || !args.where) return Promise.resolve(mockLines);
        // فیلتر زمانی
        let filtered = [...mockLines];
        if (args.where.account) {
          filtered = filtered.filter((l) => l.account === args.where.account);
        }
        if (args.where.customerId) {
          filtered = filtered.filter((l) => l.customerId === args.where.customerId);
        }
        if (args.where.voucher?.createdAt?.lt) {
          filtered = filtered.filter(
            (l) => l.voucher.createdAt < args.where.voucher.createdAt.lt,
          );
        }
        if (args.where.voucher?.createdAt?.gte) {
          filtered = filtered.filter(
            (l) => l.voucher.createdAt >= args.where.voucher.createdAt.gte,
          );
        }
        if (args.where.voucher?.createdAt?.lte) {
          filtered = filtered.filter(
            (l) => l.voucher.createdAt <= args.where.voucher.createdAt.lte,
          );
        }
        return Promise.resolve(filtered);
      }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue(mockCustomers),
    },
    purchaseInvoice: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialBalanceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TrialBalanceService>(TrialBalanceService);
    jest.clearAllMocks();
  });

  it('should generate a balanced 4-column and 8-column trial balance', async () => {
    const tb = await service.getTrialBalance({
      includeZero: false,
      includeCustomerDetails: true,
    });

    expect(tb.isBalanced).toBe(true);
    // بدهکار کل باید دقیقاً برابر با بستانکار کل باشد
    expect(tb.totals.totalDebitTurn).toBe(tb.totals.totalCreditTurn);
    expect(tb.totals.totalClosingDebitBalance).toBe(
      tb.totals.totalClosingCreditBalance,
    );

    // بررسی مانده نهایی مشتری: بدهی اولیه 150،000 - دریافت 100،000 = 50،000 بدهکار
    const custMoein = tb.moeins.find((m) => m.fixedAccount === FixedAccount.CUSTOMERS);
    expect(custMoein).toBeDefined();
    expect(custMoein?.debitTurn).toBe(150000);
    expect(custMoein?.creditTurn).toBe(100000);
    expect(custMoein?.debitBalance).toBe(50000);
    expect(custMoein?.creditBalance).toBe(0);

    // بررسی تفصیلی مشتری
    expect(tb.customerDetails).toBeDefined();
    expect(tb.customerDetails?.length).toBe(1);
    expect(tb.customerDetails?.[0].customerName).toBe('علی رضایی');
    expect(tb.customerDetails?.[0].closingDebitBalance).toBe(50000);

    // بررسی تجمیع در سطح کل و گروه
    const group1 = tb.groups.find((g) => g.code === '1'); // دارایی‌های جاری
    expect(group1).toBeDefined();
    expect(group1?.debitBalance).toBeGreaterThan(0);
  });

  it('should correctly segregate opening balance and period turns when date is filtered', async () => {
    // از تاریخ اول بهمن 2026 به بعد:
    // سند ۱ و ۲ در دی ماه (قبل از بهمن) جزو مانده ابتدای دوره هستند
    // سند ۳ در بهمن جزو گردش طی دوره است
    const tb = await service.getTrialBalance({
      from: '2026-02-01T00:00:00Z',
      to: '2026-02-28T23:59:59Z',
    });

    expect(tb.isBalanced).toBe(true);

    const custMoein = tb.moeins.find((m) => m.fixedAccount === FixedAccount.CUSTOMERS);
    expect(custMoein).toBeDefined();
    // ابتدای دوره: ۱۵۰،۰۰۰ بدهکار
    expect(custMoein?.openingDebitBalance).toBe(150000);
    // طی دوره: ۱۰۰،۰۰۰ بستانکار
    expect(custMoein?.periodCredit).toBe(100000);
    // مانده نهایی: ۵۰،۰۰۰ بدهکار
    expect(custMoein?.closingDebitBalance).toBe(50000);
  });

  it('should generate accurate general ledger with chronological running balance', async () => {
    const gl = await service.getGeneralLedger(FixedAccount.CUSTOMERS, {});

    expect(gl.account).toBe(FixedAccount.CUSTOMERS);
    expect(gl.accountInfo.name).toBe('حساب مشتریان');
    expect(gl.entries.length).toBe(2);

    // ردیف اول: بدهکار ۱۵۰،۰۰۰، مانده ۱۵۰،۰۰۰
    expect(gl.entries[0].debit).toBe(150000);
    expect(gl.entries[0].credit).toBe(0);
    expect(gl.entries[0].runningBalance).toBe(150000);
    expect(gl.entries[0].counterparty?.name).toBe('علی رضایی');

    // ردیف دوم: بستانکار ۱۰۰،۰۰۰، مانده ۵۰،۰۰۰
    expect(gl.entries[1].debit).toBe(0);
    expect(gl.entries[1].credit).toBe(100000);
    expect(gl.entries[1].runningBalance).toBe(50000);

    // مانده نهایی
    expect(gl.closingBalance.amount).toBe(50000);
    expect(gl.closingBalance.debit).toBe(50000);
  });

  it('should return complete 3-level chart of accounts structure', () => {
    const coa = service.getChartOfAccounts();

    expect(coa.groups.length).toBeGreaterThan(0);
    // هر گروه باید حداقل یک کل داشته باشد
    for (const g of coa.groups) {
      expect(g.kols.length).toBeGreaterThan(0);
      for (const k of g.kols) {
        expect(k.moeins.length).toBeGreaterThan(0);
      }
    }
    // مپینگ باید شامل تمام ۱۲ حساب ثابت باشد
    expect(Object.keys(coa.mapping).length).toBe(12);
  });
});
