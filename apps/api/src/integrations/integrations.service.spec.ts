import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from './integrations.service';

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  const mockIntegration = {
    id: 'int-woo-1',
    type: 'WOOCOMMERCE',
    name: 'فروشگاه آنلاین کاردو',
    apiUrl: 'https://shop.kardo.ir',
    apiKey: 'ck_test123',
    apiSecret: 'cs_test456',
    syncInventory: true,
    syncPrices: true,
    autoCreateInvoice: true,
    isActive: true,
    status: 'CONNECTED',
  };

  const mockWebhook = {
    id: 'wh-1',
    name: 'سامانه حسابداری طرف سوم',
    targetUrl: 'https://api.external.com/webhook',
    secret: 'super-secret-key-1234',
    events: ['invoice.created', 'payment.received'],
    isActive: true,
  };

  const mockPrisma = {
    integrationConfig: {
      findMany: jest.fn().mockResolvedValue([mockIntegration]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(mockIntegration),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'int-new', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...mockIntegration, ...args.data })),
    },
    webhookEndpoint: {
      findMany: jest.fn().mockResolvedValue([mockWebhook]),
      findUnique: jest.fn().mockResolvedValue(mockWebhook),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'wh-new', ...args.data })),
    },
    webhookLog: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: 'کابینت' }]),
      count: jest.fn().mockResolvedValue(6),
    },
    category: {
      count: jest.fn().mockResolvedValue(3),
    },
    saleInvoice: {
      findMany: jest.fn().mockResolvedValue([{ total: 15000000 }]),
    },
    productionOrder: {
      count: jest.fn().mockResolvedValue(2),
    },
    repairOrder: {
      count: jest.fn().mockResolvedValue(2),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 12000000 } }),
    },
    payrollPeriod: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalGrossPay: 218809640 } }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    jest.clearAllMocks();
  });

  it('باید تنظیمات اتصال به ووکامرس را ذخیره و فراخوانی کند', async () => {
    mockPrisma.integrationConfig.findMany.mockResolvedValue([mockIntegration]);
    const list = await service.getIntegrations();
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('WOOCOMMERCE');
  });

  it('باید رویداد وب‌هوک را با امضای رمزنگاری‌شده HMAC-SHA256 توزیع کند', async () => {
    mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockWebhook]);

    const result = await service.dispatchWebhook('invoice.created', {
      invoiceId: 'inv-1001',
      totalAmount: 45000000,
    });

    expect(result).toHaveLength(1);
    expect(result[0].statusCode).toBe(200);
    expect(result[0].isSuccess).toBe(true);
    expect(mockPrisma.webhookLog.create).toHaveBeenCalled();
  });

  it('باید شاخص‌های جامع هوش تجاری (BI) را به درستی محاسبه کند', async () => {
    const bi = await service.getBiExecutiveMetrics();
    expect(bi.totalRevenue).toBe(15000000);
    expect(bi.grossProfitMargin).toBeGreaterThan(0);
    expect(bi.inventoryTurnoverRatio).toBe(4.8);
    expect(bi.customerRetentionRate).toBe(84.5);
  });
});
