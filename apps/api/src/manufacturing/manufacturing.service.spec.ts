import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryOperationService } from '../inventory-operation/inventory-operation.service';
import { ManufacturingService } from './manufacturing.service';

describe('ManufacturingService', () => {
  let service: ManufacturingService;

  const mockProduct = {
    id: 'prod-cabinet-1',
    name: 'یونیت کمد اداری ام‌دی‌اف دو درب',
    sku: 'MDF-CAB-001',
    unit: 'دستگاه',
  };

  const mockWorkstationCutting = {
    id: 'ws-cut',
    code: 'WS-CUT',
    name: 'ایستگاه برش ورق',
    hourlyRate: 150000,
    capacityMinutesPerDay: 480,
  };

  const mockBom = {
    id: 'bom-1',
    code: 'BOM-CAB-001',
    name: 'فرمول ساخت کمد ام‌دی‌اف',
    productId: 'prod-cabinet-1',
    quantity: 1,
    unit: 'دستگاه',
    estimatedLaborCost: 250000,
    estimatedOverheadCost: 100000,
    items: [
      {
        id: 'bi-1',
        materialId: 'mat-mdf-sheet',
        quantity: 2,
        scrapPercentage: 5, // ۵ درصد پرت
      },
      {
        id: 'bi-2',
        materialId: 'mat-pvc-edge',
        quantity: 15,
        scrapPercentage: 0,
      },
    ],
    operations: [
      {
        id: 'bo-1',
        workstationId: 'ws-cut',
        step: 1,
        title: 'برش قطعات بدنه و طبقات',
      },
    ],
  };

  const mockPrisma = {
    workstation: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'ws-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([mockWorkstationCutting]),
    },
    billOfMaterials: {
      findUnique: jest.fn().mockImplementation((args) => {
        if (args.where.id === 'bom-1') return Promise.resolve(mockBom);
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'bom-1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([mockBom]),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(mockProduct),
    },
    productionOrder: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: 'mo-1',
          code: args.data.code,
          bomId: args.data.bomId,
          productId: args.data.productId,
          targetQuantity: args.data.targetQuantity,
          status: ProductionOrderStatus.PLANNED,
          totalMaterialCost: 0,
          totalLaborCost: 0,
          totalOverheadCost: 0,
          totalCost: 0,
          unitCost: 0,
          materials: args.data.materials.create.map((m: any, idx: number) => ({
            id: `issue-${idx + 1}`,
            materialId: m.materialId,
            plannedQuantity: m.plannedQuantity,
            issuedQuantity: 0,
            unitCost: 0,
            totalCost: 0,
          })),
          operations: args.data.operations.create.map((o: any, idx: number) => ({
            id: `order-op-${idx + 1}`,
            workstationId: o.workstationId,
            step: o.step,
            title: o.title,
            status: 'PENDING',
          })),
        }),
      ),
      findUnique: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: args.where.id,
          code: 'MO-2026-0001',
          bomId: 'bom-1',
          productId: 'prod-cabinet-1',
          targetQuantity: 10,
          completedQuantity: 0,
          scrapQuantity: 0,
          status: ProductionOrderStatus.PLANNED,
          totalMaterialCost: 5000000,
          totalLaborCost: 0,
          totalOverheadCost: 0,
          totalCost: 0,
          unitCost: 0,
          bom: mockBom,
          materials: [
            {
              id: 'issue-1',
              materialId: 'mat-mdf-sheet',
              plannedQuantity: 21, // 10 * 2 * 1.05
              issuedQuantity: 0,
              totalCost: 0,
            },
          ],
        }),
      ),
      update: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: args.where.id,
          ...args.data,
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
    },
    productionMaterialIssue: {
      update: jest.fn().mockResolvedValue({}),
    },
    productionOrderOperation: {
      findFirst: jest.fn().mockResolvedValue({ id: 'op-1', status: 'PENDING' }),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
    },
    qualityCheck: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'qc-1', ...args.data })),
    },
    purchaseInvoiceLine: {
      findFirst: jest.fn().mockResolvedValue({ buyPrice: 450000 }),
    },
    inventoryLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockInventoryOp = {
    execute: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManufacturingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryOperationService, useValue: mockInventoryOp },
      ],
    }).compile();

    service = module.get<ManufacturingService>(ManufacturingService);
    jest.clearAllMocks();
  });

  it('should create a workstation correctly', async () => {
    const ws = await service.createWorkstation({
      code: 'WS-CUT',
      name: 'ایستگاه برش ورق',
      hourlyRate: 150000,
    });
    expect(ws.code).toBe('WS-CUT');
    expect(mockPrisma.workstation.create).toHaveBeenCalled();
  });

  it('should create a production order and calculate material requirement with scrap percentage', async () => {
    const order = await service.createOrder({
      bomId: 'bom-1',
      productId: 'prod-cabinet-1',
      targetQuantity: 10, // سفارش ۱۰ عدد کمد
    });

    expect(order.status).toBe(ProductionOrderStatus.PLANNED);
    expect(order.materials.length).toBe(2);

    // ۲ ورق به ازای هر کمد + ۵ درصد ضایعات = ۱۰ * ۲ * ۱.۰۵ = ۲۱ ورق MDF
    const mdfRequirement = order.materials.find((m: any) => m.materialId === 'mat-mdf-sheet');
    expect(mdfRequirement?.plannedQuantity).toBe(21);

    // ۱۵ متر نوار PVC بدون ضایعات = ۱۵۰ متر
    const pvcRequirement = order.materials.find((m: any) => m.materialId === 'mat-pvc-edge');
    expect(pvcRequirement?.plannedQuantity).toBe(150);
  });

  it('should transition order to in-progress when started', async () => {
    const res = await service.startOrder('mo-1');
    expect(res.status).toBe(ProductionOrderStatus.IN_PROGRESS);
    expect(mockPrisma.productionOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mo-1' },
        data: expect.objectContaining({ status: ProductionOrderStatus.IN_PROGRESS }),
      }),
    );
  });

  it('should complete production order and calculate accurate COGM (total and unit cost)', async () => {
    const completed = await service.completeOrder('mo-1', {
      completedQuantity: 10,
      scrapQuantity: 0,
      laborCost: 2500000,
      overheadCost: 1000000,
      targetLocationId: 'loc-finished-goods',
    });

    expect(completed.status).toBe(ProductionOrderStatus.COMPLETED);
    // کل بهای تمام‌شده: ۵،۰۰۰،۰۰۰ مواد + ۲،۵۰۰،۰۰۰ دستمزد + ۱،۰۰۰،۰۰۰ سربار = ۸،۵۰۰،۰۰۰ تومان
    expect(completed.totalCost).toBe(8500000);
    // بهای تمام‌شده هر واحد: ۸،۵۰۰،۰۰۰ / ۱۰ = ۸۵۰،۰۰۰ تومان
    expect(completed.unitCost).toBe(850000);

    // ورود ۱۰ واحد محصول به انبار مقصد
    expect(mockPrisma.inventoryLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'prod-cabinet-1',
          locationId: 'loc-finished-goods',
          quantity: 10,
        }),
      }),
    );
  });
});
