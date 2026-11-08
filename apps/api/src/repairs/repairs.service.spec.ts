import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RepairsService } from './repairs.service';

describe('RepairsService', () => {
  let service: RepairsService;

  const mockCustomer = {
    id: 'cust-1',
    firstName: 'محمد',
    lastName: 'کاظمی',
    searchName: 'محمد کاظمی',
  };

  const mockProductSparePart = {
    id: 'part-blade-1',
    sku: 'SAW-BLADE-300',
    name: 'تیغ اره الماسه ۳۰ سانتی',
    unit: 'عدد',
  };

  const mockRepairOrder = {
    id: 'rep-1',
    orderNumber: 'REP-1404-0001',
    customerId: 'cust-1',
    deviceType: 'اره فارسی‌بر کشویی',
    brandAndModel: 'بوش GCM 12 GDL',
    serialNumber: 'SN-998822',
    accessories: 'کابل، تیغه فرسوده',
    customerProblem: 'موتور روشن می‌شود ولی لرزش شدید دارد',
    status: 'RECEIVED',
    laborCost: 5000000,
    partsCost: 0,
    discountAmount: 0,
    totalAmount: 5000000,
    depositPaid: 1000000,
    balanceDue: 4000000,
    isUnderWarranty: false,
    repairItems: [],
  };

  const mockPrisma = {
    customer: {
      findUnique: jest.fn().mockResolvedValue(mockCustomer),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(mockProductSparePart),
    },
    repairOrder: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'rep-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([mockRepairOrder]),
      findUnique: jest.fn().mockResolvedValue(mockRepairOrder),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...mockRepairOrder, ...args.data })),
    },
    repairItem: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'item-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({ id: 'item-1' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RepairsService>(RepairsService);
    jest.clearAllMocks();
  });

  it('باید برگه پذیرش جدید با شماره خودکار REP-1404-0001 ثبت کند', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
    mockPrisma.repairOrder.count.mockResolvedValue(0);

    const order = await service.createRepairOrder({
      customerId: 'cust-1',
      deviceType: 'اره فارسی‌بر کشویی',
      brandAndModel: 'بوش GCM 12 GDL',
      serialNumber: 'SN-998822',
      customerProblem: 'موتور روشن می‌شود ولی لرزش شدید دارد',
      laborCost: 5000000,
      depositPaid: 1000000,
    });

    expect(order.orderNumber).toBe('REP-1404-0001');
    expect(order.status).toBe('RECEIVED');
    expect(order.totalAmount).toBe(5000000);
    expect(order.balanceDue).toBe(4000000);
  });

  it('باید قطعه یدکی مصرفی را به فاکتور تعمیر اضافه و مبالغ را به‌روز کند', async () => {
    mockPrisma.repairOrder.findUnique.mockResolvedValue(mockRepairOrder);
    mockPrisma.product.findUnique.mockResolvedValue(mockProductSparePart);
    mockPrisma.repairItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        repairOrderId: 'rep-1',
        productId: 'part-blade-1',
        quantity: 1,
        unitPrice: 8000000,
        totalPrice: 8000000,
      },
    ]);

    const updated = await service.addRepairItem('rep-1', {
      productId: 'part-blade-1',
      quantity: 1,
      unitPrice: 8000000,
    });

    expect(updated.partsCost).toBe(8000000);
    // مبلغ کل = اجرت ۵ میلیون + قطعات ۸ میلیون = ۱۳ میلیون
    expect(updated.totalAmount).toBe(13000000);
    // مانده = ۱۳ میلیون منهای ۱ میلیون بیعانه = ۱۲ میلیون
    expect(updated.balanceDue).toBe(12000000);
  });

  it('باید چرخه وضعیت تعمیرگاه را از پذیرش تا تحویل تغییر دهد', async () => {
    mockPrisma.repairOrder.findUnique.mockResolvedValue(mockRepairOrder);

    const readyOrder = await service.updateRepairStatus('rep-1', {
      status: 'READY',
      technicalReport: 'بلبرینگ‌های شفت اصلی تعویض و تیغ اره تراز شد',
    });

    expect(readyOrder.status).toBe('READY');
  });
});
