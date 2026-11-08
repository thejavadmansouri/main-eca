import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChequeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BounceChequeDto,
  ClearChequeDto,
  CreateTreasuryAccountDto,
  DepositChequeDto,
  EndorseChequeDto,
  RegisterChequeDto,
  TransferFundsDto,
  UpdateTreasuryAccountDto,
} from './dto/treasury.dto';

@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────── حساب‌های خزانه‌داری (بانک‌ها و صندوق‌ها) ─────────────────────────
  async getAccounts() {
    return this.prisma.treasuryAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            depositedCheques: true,
            inTransactions: true,
            outTransactions: true,
          },
        },
      },
    });
  }

  async getAccountById(id: string) {
    const acc = await this.prisma.treasuryAccount.findUnique({
      where: { id },
      include: {
        depositedCheques: {
          orderBy: { dueDate: 'asc' },
        },
        inTransactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
        outTransactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
      },
    });
    if (!acc) throw new NotFoundException('حساب خزانه‌داری یافت نشد.');
    return acc;
  }

  async createAccount(dto: CreateTreasuryAccountDto) {
    return this.prisma.treasuryAccount.create({
      data: {
        name: dto.name,
        type: dto.type || 'BANK',
        accountNumber: dto.accountNumber,
        iban: dto.iban,
        bankName: dto.bankName,
        branchName: dto.branchName,
        balance: dto.balance ? Number(dto.balance) : 0,
        posTerminalId: dto.posTerminalId,
        notes: dto.notes,
        isActive: true,
      },
    });
  }

  async updateAccount(id: string, dto: UpdateTreasuryAccountDto) {
    const acc = await this.prisma.treasuryAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException('حساب خزانه‌داری یافت نشد.');

    return this.prisma.treasuryAccount.update({
      where: { id },
      data: {
        name: dto.name,
        accountNumber: dto.accountNumber,
        iban: dto.iban,
        bankName: dto.bankName,
        branchName: dto.branchName,
        balance: dto.balance !== undefined ? Number(dto.balance) : undefined,
        posTerminalId: dto.posTerminalId,
        isActive: dto.isActive,
        notes: dto.notes,
      },
    });
  }

  // ───────────────────────── مدیریت چک‌های صیادی و کارتابل خزانه ─────────────────────────
  async getCheques(filter?: {
    status?: string;
    chequeType?: string;
    q?: string;
    fromDate?: string;
    toDate?: string;
    isOverdue?: boolean;
  }) {
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.chequeType) {
      where.chequeType = filter.chequeType;
    }

    if (filter?.isOverdue) {
      where.status = { in: ['IN_HAND', 'DEPOSITED'] };
      where.dueDate = { lt: new Date() };
    }

    if (filter?.fromDate || filter?.toDate) {
      where.dueDate = {};
      if (filter.fromDate) where.dueDate.gte = new Date(filter.fromDate);
      if (filter.toDate) where.dueDate.lte = new Date(filter.toDate);
    }

    if (filter?.q) {
      const q = filter.q.trim();
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { sayadId: { contains: q, mode: 'insensitive' } },
        { bankName: { contains: q, mode: 'insensitive' } },
        { holderName: { contains: q, mode: 'insensitive' } },
        { drawerNationalId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const cheques = await this.prisma.cheque.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        targetAccount: { select: { id: true, name: true, bankName: true } },
        payment: {
          select: {
            amount: true,
            invoice: { select: { id: true, number: true, customer: { select: { firstName: true, lastName: true } } } },
          },
        },
        receiptPayment: {
          select: {
            amount: true,
            receipt: { select: { id: true, number: true, customer: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    return cheques.map((ch: any) => {
      const cust = ch.payment?.invoice?.customer || ch.receiptPayment?.receipt?.customer;
      const customerName = cust
        ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim()
        : (ch.holderName || 'نامشخص');
      const effectiveAmount =
        ch.amount ?? ch.payment?.amount ?? ch.receiptPayment?.amount ?? 0;

      return {
        ...ch,
        customerName,
        effectiveAmount,
      };
    });
  }

  async getChequeAnalytics() {
    const allCheques = await this.prisma.cheque.findMany({
      include: {
        payment: { select: { amount: true } },
        receiptPayment: { select: { amount: true } },
      },
    });

    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    let inHandAmount = 0;
    let inHandCount = 0;
    let depositedAmount = 0;
    let depositedCount = 0;
    let cashedAmount = 0;
    let cashedCount = 0;
    let bouncedAmount = 0;
    let bouncedCount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let upcomingDueCount = 0;
    let upcomingDueAmount = 0;

    for (const c of allCheques) {
      const amt = c.amount ?? c.payment?.amount ?? c.receiptPayment?.amount ?? 0;
      if (c.status === 'IN_HAND') {
        inHandAmount += amt;
        inHandCount++;
      } else if (c.status === 'DEPOSITED') {
        depositedAmount += amt;
        depositedCount++;
      } else if (c.status === 'CASHED') {
        cashedAmount += amt;
        cashedCount++;
      } else if (c.status === 'BOUNCED') {
        bouncedAmount += amt;
        bouncedCount++;
      }

      if (['IN_HAND', 'DEPOSITED'].includes(c.status)) {
        if (new Date(c.dueDate) < now) {
          overdueCount++;
          overdueAmount += amt;
        } else if (new Date(c.dueDate) <= oneWeekLater) {
          upcomingDueCount++;
          upcomingDueAmount += amt;
        }
      }
    }

    return {
      inHandAmount,
      inHandCount,
      depositedAmount,
      depositedCount,
      cashedAmount,
      cashedCount,
      bouncedAmount,
      bouncedCount,
      overdueCount,
      overdueAmount,
      upcomingDueCount,
      upcomingDueAmount,
      totalTrackedCount: allCheques.length,
    };
  }

  async registerCheque(dto: RegisterChequeDto) {
    return this.prisma.cheque.create({
      data: {
        number: dto.number,
        sayadId: dto.sayadId,
        chequeType: dto.chequeType || 'RECEIVABLE',
        amount: Number(dto.amount),
        bankName: dto.bankName,
        branch: dto.branch,
        holderName: dto.holderName,
        drawerNationalId: dto.drawerNationalId,
        dueDate: new Date(dto.dueDate),
        status: ChequeStatus.IN_HAND,
        note: dto.note,
      },
    });
  }

  async depositCheque(id: string, dto: DepositChequeDto) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!cheque) throw new NotFoundException('چک یافت نشد.');

    if (cheque.status !== 'IN_HAND') {
      throw new BadRequestException('تنها چک‌های موجود نزد صندوق قابل واگذاری به بانک هستند.');
    }

    const targetAccount = await this.prisma.treasuryAccount.findUnique({
      where: { id: dto.targetAccountId },
    });
    if (!targetAccount) throw new NotFoundException('حساب بانکی مقصد یافت نشد.');

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: ChequeStatus.DEPOSITED,
        targetAccountId: dto.targetAccountId,
      },
    });
  }

  async clearCheque(id: string, dto?: ClearChequeDto) {
    const cheque = await this.prisma.cheque.findUnique({
      where: { id },
      include: {
        payment: { select: { amount: true } },
        receiptPayment: { select: { amount: true } },
      },
    });
    if (!cheque) throw new NotFoundException('چک یافت نشد.');

    if (cheque.status === 'CASHED') {
      throw new ConflictException('این چک قبلاً وصول شده است.');
    }

    const amount = cheque.amount ?? cheque.payment?.amount ?? cheque.receiptPayment?.amount ?? 0;
    const targetAccountId = dto?.targetAccountId || cheque.targetAccountId;

    return this.prisma.$transaction(async (tx) => {
      // اگر حساب مقصد مشخص بود، موجودی آن افزایش می‌یابد
      if (targetAccountId) {
        await tx.treasuryAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: amount } },
        });
      }

      return tx.cheque.update({
        where: { id },
        data: {
          status: ChequeStatus.CASHED,
          settledAt: dto?.clearDate ? new Date(dto.clearDate) : new Date(),
          targetAccountId: targetAccountId || undefined,
        },
      });
    });
  }

  async bounceCheque(id: string, dto: BounceChequeDto) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!cheque) throw new NotFoundException('چک یافت نشد.');

    if (cheque.status === 'CASHED') {
      throw new BadRequestException('چک وصول‌شده نمی‌تواند برگشت بخورد.');
    }

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: ChequeStatus.BOUNCED,
        bounceReason: dto.bounceReason,
        bouncedAt: dto.bouncedDate ? new Date(dto.bouncedDate) : new Date(),
      },
    });
  }

  async endorseCheque(id: string, dto: EndorseChequeDto) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!cheque) throw new NotFoundException('چک یافت نشد.');

    if (cheque.status !== 'IN_HAND') {
      throw new BadRequestException('تنها چک‌های موجود نزد صندوق قابل خرج‌کردن به غیر هستند.');
    }

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: ChequeStatus.PASSED,
        endorsedTo: dto.endorsedTo,
        endorsedAt: dto.endorsedDate ? new Date(dto.endorsedDate) : new Date(),
        note: dto.note ? `${cheque.note || ''} | خرج شد به: ${dto.endorsedTo}` : cheque.note,
      },
    });
  }

  async returnCheque(id: string) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!cheque) throw new NotFoundException('چک یافت نشد.');

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: ChequeStatus.RETURNED,
      },
    });
  }

  // ───────────────────────── انتقالات بین‌حسابی خزانه‌داری ─────────────────────────
  async transferFunds(dto: TransferFundsDto) {
    if (dto.sourceAccountId === dto.targetAccountId) {
      throw new BadRequestException('حساب مبدا و مقصد نمی‌تواند یکسان باشد.');
    }

    const source = await this.prisma.treasuryAccount.findUnique({
      where: { id: dto.sourceAccountId },
    });
    if (!source) throw new NotFoundException('حساب مبدا یافت نشد.');

    const target = await this.prisma.treasuryAccount.findUnique({
      where: { id: dto.targetAccountId },
    });
    if (!target) throw new NotFoundException('حساب مقصد یافت نشد.');

    const count = await this.prisma.treasuryTransaction.count();
    const transactionNumber = `TR-1404-${String(count + 1).padStart(4, '0')}`;
    const amount = Number(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      // کسر از حساب مبدا
      await tx.treasuryAccount.update({
        where: { id: dto.sourceAccountId },
        data: { balance: { decrement: amount } },
      });

      // واریز به حساب مقصد
      await tx.treasuryAccount.update({
        where: { id: dto.targetAccountId },
        data: { balance: { increment: amount } },
      });

      // ثبت سند تراکنش
      return tx.treasuryTransaction.create({
        data: {
          transactionNumber,
          type: 'TRANSFER',
          sourceAccountId: dto.sourceAccountId,
          targetAccountId: dto.targetAccountId,
          amount,
          trackingCode: dto.trackingCode,
          description: dto.description,
        },
      });
    });
  }

  async getTransactions(limit = 30) {
    return this.prisma.treasuryTransaction.findMany({
      orderBy: { transactionDate: 'desc' },
      take: limit,
      include: {
        sourceAccount: { select: { name: true, type: true } },
        targetAccount: { select: { name: true, type: true } },
      },
    });
  }
}
