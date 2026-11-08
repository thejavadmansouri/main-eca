import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryAction,
  Prisma,
  ProductionOrderStatus,
  WorkstationStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryOperationService } from '../inventory-operation/inventory-operation.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import {
  CompleteOrderDto,
  CreateProductionOrderDto,
  IssueMaterialsDto,
  RecordQualityCheckDto,
  UpdateOperationProgressDto,
} from './dto/create-production-order.dto';

@Injectable()
export class ManufacturingService {
  constructor(
    private prisma: PrismaService,
    private inventoryOp: InventoryOperationService,
  ) {}

  // ───────────────────────── ایستگاه‌های کاری (Workstations) ─────────────────────────

  async createWorkstation(dto: CreateWorkstationDto) {
    const existing = await this.prisma.workstation.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`ایستگاه کاری با کد ${dto.code} قبلاً تعریف شده است`);
    }

    return this.prisma.workstation.create({
      data: {
        code: dto.code,
        name: dto.name,
        hourlyRate: dto.hourlyRate ?? 0,
        capacityMinutesPerDay: dto.capacityMinutesPerDay ?? 480,
        location: dto.location,
      },
    });
  }

  async listWorkstations() {
    return this.prisma.workstation.findMany({
      orderBy: { code: 'asc' },
    });
  }

  // ───────────────────────── درخت محصول / فرمول ساخت (BOM) ─────────────────────────

  async createBom(dto: CreateBomDto) {
    const existing = await this.prisma.billOfMaterials.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`فرمول ساخت با کد ${dto.code} قبلاً تعریف شده است`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new NotFoundException(`محصول با شناسه ${dto.productId} یافت نشد`);
    }

    return this.prisma.billOfMaterials.create({
      data: {
        code: dto.code,
        name: dto.name,
        productId: dto.productId,
        quantity: dto.quantity ?? 1,
        unit: dto.unit ?? 'عدد',
        routingNote: dto.routingNote,
        estimatedLaborCost: dto.estimatedLaborCost ?? 0,
        estimatedOverheadCost: dto.estimatedOverheadCost ?? 0,
        items: {
          create: dto.items.map((it) => ({
            materialId: it.materialId,
            quantity: it.quantity,
            unit: it.unit ?? 'عدد',
            scrapPercentage: it.scrapPercentage ?? 0,
            note: it.note,
          })),
        },
        operations: dto.operations?.length
          ? {
              create: dto.operations.map((op) => ({
                workstationId: op.workstationId,
                step: op.step,
                title: op.title,
                durationMinutes: op.durationMinutes ?? 0,
                instructions: op.instructions,
              })),
            }
          : undefined,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        items: {
          include: {
            material: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
        operations: {
          include: {
            workstation: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async listBoms(filter?: { productId?: string; isActive?: boolean }) {
    const where: Prisma.BillOfMaterialsWhereInput = {};
    if (filter?.productId) where.productId = filter.productId;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;

    return this.prisma.billOfMaterials.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        _count: { select: { items: true, operations: true, productionOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBomById(id: string) {
    const bom = await this.prisma.billOfMaterials.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        items: {
          include: {
            material: {
              select: { id: true, name: true, sku: true, unit: true, prices: true },
            },
          },
        },
        operations: {
          include: {
            workstation: true,
          },
          orderBy: { step: 'asc' },
        },
      },
    });

    if (!bom) {
      throw new NotFoundException(`فرمول ساخت با شناسه ${id} یافت نشد`);
    }

    return bom;
  }

  // ───────────────────────── سفارشات تولید (Production Orders) ─────────────────────────

  async createOrder(dto: CreateProductionOrderDto) {
    const bom = await this.prisma.billOfMaterials.findUnique({
      where: { id: dto.bomId },
      include: {
        items: true,
        operations: true,
      },
    });
    if (!bom) {
      throw new NotFoundException(`فرمول ساخت ${dto.bomId} یافت نشد`);
    }

    // تولید کد خودکار در صورت نبودن کد
    const count = await this.prisma.productionOrder.count();
    const code = dto.code || `MO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const multiplier = dto.targetQuantity / (bom.quantity || 1);

    return this.prisma.productionOrder.create({
      data: {
        code,
        bomId: dto.bomId,
        productId: dto.productId,
        targetQuantity: dto.targetQuantity,
        priority: dto.priority ?? 1,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        warehouseId: dto.warehouseId,
        targetWarehouseId: dto.targetWarehouseId,
        companyId: dto.companyId,
        branchId: dto.branchId,
        notes: dto.notes,
        status: ProductionOrderStatus.PLANNED,
        // پیش‌بینی نیاز مواد اولیه بر اساس BOM و ضریب ضایعات
        materials: {
          create: bom.items.map((it) => {
            const scrapFactor = 1 + (it.scrapPercentage || 0) / 100;
            const plannedQty = it.quantity * multiplier * scrapFactor;
            return {
              materialId: it.materialId,
              plannedQuantity: Math.round(plannedQty * 100) / 100,
            };
          }),
        },
        // ایجاد ایستگاه‌های کاری مرتبط با سفارش
        operations: {
          create: bom.operations.map((op) => ({
            workstationId: op.workstationId,
            step: op.step,
            title: op.title,
            status: 'PENDING',
          })),
        },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
        operations: {
          include: {
            workstation: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async startOrder(id: string) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد');

    if (order.status !== ProductionOrderStatus.PLANNED && order.status !== ProductionOrderStatus.DRAFT) {
      throw new BadRequestException(`امکان شروع سفارش در وضعیت ${order.status} وجود ندارد`);
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionOrderStatus.IN_PROGRESS,
        startDate: new Date(),
      },
    });
  }

  async issueMaterials(id: string, dto: IssueMaterialsDto) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: { materials: true },
    });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد');

    let additionalCost = 0;

    for (const issue of dto.issues) {
      const matRow = order.materials.find((m) => m.materialId === issue.materialId);
      if (!matRow) continue;

      // دریافت میانگین نرخ خرید اخیر برای محاسبه بهای تمام‌شده
      let unitCost = issue.unitCost ?? 0;
      if (!unitCost) {
        const lastPurchase = await this.prisma.inventoryLog.findFirst({
          where: {
            productId: issue.materialId,
            action: InventoryAction.IN,
            purchaseId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { unitPrice: true },
        });
        unitCost = lastPurchase?.unitPrice ?? 0;
      }

      const rowTotal = issue.quantity * unitCost;
      additionalCost += rowTotal;

      await this.prisma.productionMaterialIssue.update({
        where: { id: matRow.id },
        data: {
          issuedQuantity: matRow.issuedQuantity + issue.quantity,
          unitCost,
          totalCost: (matRow.totalCost || 0) + rowTotal,
        },
      });

      // در صورت وجود انبار و قفسه، خروج واقعی از انبار مواد اولیه ثبت می‌شود
      if (issue.locationId) {
        await this.prisma.inventoryLog.create({
          data: {
            productId: issue.materialId,
            locationId: issue.locationId,
            quantity: -Math.abs(Math.round(issue.quantity)),
            action: InventoryAction.OUT,
            note: `حواله مصرف در سفارش تولید ${order.code}`,
          },
        });
      }
    }

    // به‌روزرسانی هزینه مواد سفارش
    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        totalMaterialCost: order.totalMaterialCost + additionalCost,
        status: ProductionOrderStatus.IN_PROGRESS,
      },
      include: {
        materials: {
          include: {
            material: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });
  }

  async updateOperation(id: string, opId: string, dto: UpdateOperationProgressDto) {
    const op = await this.prisma.productionOrderOperation.findFirst({
      where: { id: opId, productionOrderId: id },
    });
    if (!op) throw new NotFoundException('مرحله عملیاتی سفارش یافت نشد');

    return this.prisma.productionOrderOperation.update({
      where: { id: opId },
      data: {
        status: dto.status,
        actualMinutes: dto.actualMinutes ?? op.actualMinutes,
        operatorName: dto.operatorName ?? op.operatorName,
        startedAt: dto.status === 'IN_PROGRESS' && !op.startedAt ? new Date() : op.startedAt,
        finishedAt: dto.status === 'DONE' ? new Date() : op.finishedAt,
      },
    });
  }

  async recordQualityCheck(id: string, dto: RecordQualityCheckDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد');

    const qc = await this.prisma.qualityCheck.create({
      data: {
        productionOrderId: id,
        inspectorName: dto.inspectorName,
        passed: dto.passed,
        checklist: dto.checklist ?? {},
        defects: dto.defects,
      },
    });

    if (dto.passed) {
      await this.prisma.productionOrder.update({
        where: { id },
        data: { status: ProductionOrderStatus.QUALITY_CHECK },
      });
    }

    return qc;
  }

  async completeOrder(id: string, dto: CompleteOrderDto) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        bom: true,
        materials: true,
      },
    });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد');

    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new BadRequestException('این سفارش قبلاً تکمیل شده است');
    }

    const laborCost = dto.laborCost ?? order.bom.estimatedLaborCost * dto.completedQuantity;
    const overheadCost = dto.overheadCost ?? order.bom.estimatedOverheadCost * dto.completedQuantity;
    const totalCost = order.totalMaterialCost + laborCost + overheadCost;
    const unitCost = dto.completedQuantity > 0 ? totalCost / dto.completedQuantity : 0;

    // ورود محصول نهایی به انبار در صورت تعیین قفسه مقصد
    if (dto.targetLocationId && dto.completedQuantity > 0) {
      await this.prisma.inventoryLog.create({
        data: {
          productId: order.productId,
          locationId: dto.targetLocationId,
          quantity: Math.round(dto.completedQuantity),
          action: InventoryAction.IN,
          note: `رسید تولید محصول نهایی از سفارش ساخت ${order.code}`,
          unitPrice: unitCost,
        },
      });
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        completedQuantity: dto.completedQuantity,
        scrapQuantity: dto.scrapQuantity ?? 0,
        totalLaborCost: laborCost,
        totalOverheadCost: overheadCost,
        totalCost,
        unitCost,
        status: ProductionOrderStatus.COMPLETED,
        actualEndDate: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true, sku: true } },
          },
        },
        operations: {
          include: {
            workstation: { select: { id: true, code: true, name: true } },
          },
        },
        qualityChecks: true,
      },
    });
  }

  async listOrders(filter?: {
    status?: ProductionOrderStatus;
    productId?: string;
  }) {
    const where: Prisma.ProductionOrderWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.productId) where.productId = filter.productId;

    return this.prisma.productionOrder.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        bom: { select: { id: true, code: true, name: true } },
        _count: { select: { operations: true, materials: true, qualityChecks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        bom: {
          select: {
            id: true,
            code: true,
            name: true,
            estimatedLaborCost: true,
            estimatedOverheadCost: true,
          },
        },
        materials: {
          include: {
            material: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
        operations: {
          include: {
            workstation: true,
          },
          orderBy: { step: 'asc' },
        },
        qualityChecks: {
          orderBy: { inspectedAt: 'desc' },
        },
      },
    });

    if (!order) throw new NotFoundException(`سفارش تولید با شناسه ${id} یافت نشد`);
    return order;
  }
}
