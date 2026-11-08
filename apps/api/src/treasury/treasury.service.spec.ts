import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TreasuryService } from './treasury.service';

describe('TreasuryService', () => {
  let service: TreasuryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      treasuryAccount: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'acc-1', name: 'بانک ملت', balance: 50000000 },
        ]),
        findUnique: jest.fn().mockResolvedValue({ id: 'acc-1', name: 'بانک ملت', balance: 50000000 }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'acc-new', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'acc-1', ...data })),
      },
      cheque: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ch-1',
            number: '123456',
            sayadId: '1234567890123456',
            amount: 25000000,
            status: 'IN_HAND',
            dueDate: new Date(),
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'ch-1',
          number: '123456',
          status: 'IN_HAND',
          amount: 25000000,
        }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ch-new', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ch-1', ...data })),
      },
      treasuryTransaction: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tr-new', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a treasury account', async () => {
    const res = await service.createAccount({
      name: 'صندوق شرکت',
      type: 'CASH_DESK',
      balance: 10000000,
    });
    expect(res.name).toBe('صندوق شرکت');
    expect(prisma.treasuryAccount.create).toHaveBeenCalled();
  });

  it('should register a new Sayad cheque', async () => {
    const res = await service.registerCheque({
      number: '987654',
      sayadId: '9876543210987654',
      amount: 15000000,
      bankName: 'بانک صادرات',
      dueDate: new Date().toISOString(),
    });
    expect(res.number).toBe('987654');
    expect(prisma.cheque.create).toHaveBeenCalled();
  });

  it('should deposit in-hand cheque to bank', async () => {
    const res = await service.depositCheque('ch-1', {
      targetAccountId: 'acc-1',
    });
    expect(res.status).toBe('DEPOSITED');
    expect(res.targetAccountId).toBe('acc-1');
  });

  it('should clear cheque and increment target account balance', async () => {
    const res = await service.clearCheque('ch-1', {
      targetAccountId: 'acc-1',
    });
    expect(res.status).toBe('CASHED');
    expect(prisma.treasuryAccount.update).toHaveBeenCalled();
  });

  it('should bounce cheque with reason', async () => {
    prisma.cheque.findUnique.mockResolvedValueOnce({
      id: 'ch-1',
      status: 'DEPOSITED',
    });
    const res = await service.bounceCheque('ch-1', {
      bounceReason: 'کسر موجودی در تاریخ سررسید',
    });
    expect(res.status).toBe('BOUNCED');
    expect(res.bounceReason).toBe('کسر موجودی در تاریخ سررسید');
  });

  it('should transfer funds between treasury accounts', async () => {
    prisma.treasuryAccount.findUnique
      .mockResolvedValueOnce({ id: 'acc-1', name: 'بانک ملت', balance: 50000000 })
      .mockResolvedValueOnce({ id: 'acc-2', name: 'صندوق', balance: 2000000 });

    const res = await service.transferFunds({
      sourceAccountId: 'acc-1',
      targetAccountId: 'acc-2',
      amount: 5000000,
      description: 'تأمین وجه صندوق',
    });
    expect(res.amount).toBe(5000000);
    expect(res.transactionNumber).toBe('TR-1404-0001');
    expect(prisma.treasuryAccount.update).toHaveBeenCalledTimes(2);
  });
});
