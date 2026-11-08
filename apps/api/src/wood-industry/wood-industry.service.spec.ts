import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WoodIndustryService } from './wood-industry.service';

describe('WoodIndustryService', () => {
  let service: WoodIndustryService;

  const mockProdOrder = {
    id: 'mo-1',
    code: 'MO-1404-0001',
    targetQuantity: 5,
    status: 'IN_PROGRESS',
    priority: 2,
    product: { name: 'یونیت کمد اداری ام‌دی‌اف', sku: 'MDF-CAB-001' },
    cuttingListItems: [
      {
        id: 'cut-1',
        partName: 'دیواره راست',
        lengthMm: 1800,
        widthMm: 550,
        thicknessMm: 16,
        isCut: true,
        isEdged: true,
        isCncDone: false,
        isAssembled: false,
      },
    ],
  };

  const mockCuttingPart = {
    id: 'cut-1',
    productionOrderId: 'mo-1',
    partName: 'دیواره چپ',
    materialType: 'ام‌دی‌اف سفید صابونی ۱۶ میل',
    lengthMm: 1800,
    widthMm: 550,
    thicknessMm: 16,
    quantity: 1,
    edgeL1: 'PVC 2mm',
    barcode: 'CUT-00001',
    status: 'PENDING',
    isCut: false,
    isEdged: false,
    isCncDone: false,
    isAssembled: false,
    productionOrder: { code: 'MO-1404-0001' },
  };

  const mockPrisma = {
    productionOrder: {
      findUnique: jest.fn().mockResolvedValue(mockProdOrder),
      findFirst: jest.fn().mockResolvedValue(mockProdOrder),
      findMany: jest.fn().mockResolvedValue([mockProdOrder]),
    },
    cuttingListItem: {
      findMany: jest.fn().mockResolvedValue([mockCuttingPart]),
      findUnique: jest.fn().mockResolvedValue(mockCuttingPart),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'cut-new', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...mockCuttingPart, ...args.data })),
    },
    woodOrderProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'prf-new', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data })),
    },
    productionScanLog: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'scan-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    installationOrder: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'inst-1', ...args.data })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WoodIndustryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WoodIndustryService>(WoodIndustryService);
    jest.clearAllMocks();
  });

  it('باید آیتم جدید لیست برش را با ابعاد، نوار لبه و بارکد یکتا ثبت کند', async () => {
    mockPrisma.productionOrder.findUnique.mockResolvedValue(mockProdOrder);
    mockPrisma.cuttingListItem.count.mockResolvedValue(0);

    const part = await service.addCuttingItem({
      productionOrderId: 'mo-1',
      partName: 'دیواره چپ',
      materialType: 'ام‌دی‌اف سفید صابونی',
      lengthMm: 1800,
      widthMm: 550,
      edgeL1: 'PVC 2mm',
    });

    expect(part.barcode).toBe('CUT-00001');
    expect(part.lengthMm).toBe(1800);
    expect(mockPrisma.cuttingListItem.create).toHaveBeenCalled();
  });

  it('باید اسکن بارکد قطعه در ایستگاه برش اره (SAW) را پردازش و ثبت کند', async () => {
    mockPrisma.cuttingListItem.findUnique.mockResolvedValue(mockCuttingPart);

    const scanResult = await service.processShopFloorScan({
      barcode: 'CUT-00001',
      stationCode: 'SAW',
      operatorName: 'احمد اپراتور برش',
    });

    expect(scanResult.type).toBe('CUTTING_PART');
    expect(scanResult.isSuccess).toBe(true);
    expect(mockPrisma.productionScanLog.create).toHaveBeenCalled();
  });

  it('باید ماتریس گزارش جامع تولید (FlexERP Matrix) را محاسبه کند', async () => {
    mockPrisma.productionOrder.findMany.mockResolvedValue([mockProdOrder]);

    const matrix = await service.getComprehensiveProductionMatrix();
    expect(matrix).toHaveLength(1);
    expect(matrix[0].code).toBe('MO-1404-0001');
    expect(matrix[0].totalParts).toBe(1);
    expect(matrix[0].cutCount).toBe(1);
    expect(matrix[0].edgeCount).toBe(1);
  });
});
