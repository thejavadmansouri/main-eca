import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddCuttingItemDto,
  AddProfileGlassDto,
  CreateInstallationDto,
  ProcessScanDto,
  CreateWoodOrderDto,
  AdvanceStageDto,
  CreateInboundReceiptDto,
  VerifyInboundReceiptDto,
} from './dto/wood-industry.dto';

@Injectable()
export class WoodIndustryService {
  private readonly logger = new Logger(WoodIndustryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────── لیست برش و ابعاد قطعات MDF ─────────────────────────
  async getCuttingList(productionOrderId: string) {
    return this.prisma.cuttingListItem.findMany({
      where: { productionOrderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addCuttingItem(dto: AddCuttingItemDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id: dto.productionOrderId } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد.');

    const count = await this.prisma.cuttingListItem.count();
    const barcode = `CUT-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.cuttingListItem.create({
      data: {
        productionOrderId: dto.productionOrderId,
        partName: dto.partName,
        materialType: dto.materialType,
        lengthMm: Number(dto.lengthMm),
        widthMm: Number(dto.widthMm),
        thicknessMm: dto.thicknessMm ? Number(dto.thicknessMm) : 16,
        quantity: dto.quantity ? Number(dto.quantity) : 1,
        grainDirection: dto.grainDirection || 'NONE',
        edgeL1: dto.edgeL1,
        edgeL2: dto.edgeL2,
        edgeW1: dto.edgeW1,
        edgeW2: dto.edgeW2,
        barcode,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  // ───────────────────────── لیبل پروفیل و شیشه ─────────────────────────
  async getWoodProfiles(productionOrderId: string) {
    return this.prisma.woodOrderProfile.findMany({
      where: { productionOrderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addWoodProfile(dto: AddProfileGlassDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id: dto.productionOrderId } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد.');

    const prefix = dto.itemType === 'GLASS' ? 'GLS' : 'PRF';
    const count = await this.prisma.woodOrderProfile.count();
    const barcode = `${prefix}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.woodOrderProfile.create({
      data: {
        productionOrderId: dto.productionOrderId,
        itemType: dto.itemType,
        title: dto.title,
        dimensions: dto.dimensions,
        quantity: dto.quantity ? Number(dto.quantity) : 1,
        unit: dto.unit || (dto.itemType === 'GLASS' ? 'جام' : 'شاخه'),
        supplierName: dto.supplierName,
        barcode,
        status: 'ORDERED',
        notes: dto.notes,
      },
    });
  }

  // ───────────────────────── کنسول اسکن بارکد کارگاهی (Scan Monitor Console) ─────────────────────────
  async processShopFloorScan(dto: ProcessScanDto) {
    const trimmedBarcode = dto.barcode.trim();
    const station = dto.stationCode.toUpperCase();

    // ۱. بررسی قطعه برش (Cutting Part)
    const cuttingPart = await this.prisma.cuttingListItem.findUnique({
      where: { barcode: trimmedBarcode },
      include: { productionOrder: true },
    });

    if (cuttingPart) {
      let newStatus = cuttingPart.status;
      const updates: any = {};

      if (station === 'SAW') {
        updates.isCut = true;
        newStatus = 'CUT';
      } else if (station === 'EDGE') {
        updates.isEdged = true;
        newStatus = 'EDGED';
      } else if (station === 'CNC') {
        updates.isCncDone = true;
        newStatus = 'CNC_DONE';
      } else if (station === 'ASSM') {
        updates.isAssembled = true;
        newStatus = 'ASSEMBLED';
      }

      updates.status = newStatus;

      const updatedPart = await this.prisma.cuttingListItem.update({
        where: { id: cuttingPart.id },
        data: updates,
      });

      // ثبت لاگ اسکن
      await this.prisma.productionScanLog.create({
        data: {
          productionOrderId: cuttingPart.productionOrderId,
          barcode: trimmedBarcode,
          operatorName: dto.operatorName,
          stationCode: station,
          action: `اسکن موفق در ایستگاه ${station}: وضعیت به ${newStatus} تغییر یافت`,
          isSuccess: true,
        },
      });

      return {
        type: 'CUTTING_PART',
        message: `قطعه «${cuttingPart.partName}» (${cuttingPart.lengthMm}x${cuttingPart.widthMm} mm) در ایستگاه ${station} با موفقیت ثبت شد.`,
        part: updatedPart,
        orderCode: cuttingPart.productionOrder?.code,
        isSuccess: true,
      };
    }

    // ۲. بررسی لیبل پروفیل یا شیشه
    const profileItem = await this.prisma.woodOrderProfile.findUnique({
      where: { barcode: trimmedBarcode },
    });

    if (profileItem) {
      const updatedProfile = await this.prisma.woodOrderProfile.update({
        where: { id: profileItem.id },
        data: {
          status: station === 'ASSM' ? 'INSTALLED' : 'CUT',
        },
      });

      await this.prisma.productionScanLog.create({
        data: {
          productionOrderId: profileItem.productionOrderId,
          barcode: trimmedBarcode,
          operatorName: dto.operatorName,
          stationCode: station,
          action: `اسکن پروفیل/شیشه در ایستگاه ${station}`,
          isSuccess: true,
        },
      });

      return {
        type: 'PROFILE_GLASS',
        message: `آیتم «${profileItem.title}» ثبت شد.`,
        profile: updatedProfile,
        isSuccess: true,
      };
    }

    // ۳. بررسی سفارش تولید کل (Production Order Code)
    const prodOrder = await this.prisma.productionOrder.findFirst({
      where: { code: trimmedBarcode },
    });

    if (prodOrder) {
      await this.prisma.productionScanLog.create({
        data: {
          productionOrderId: prodOrder.id,
          barcode: trimmedBarcode,
          operatorName: dto.operatorName,
          stationCode: station,
          action: `اسکن سربرگ سفارش تولید ${prodOrder.code}`,
          isSuccess: true,
        },
      });

      return {
        type: 'PRODUCTION_ORDER',
        message: `برگه سفارش تولید ${prodOrder.code} ثبت شد.`,
        order: prodOrder,
        isSuccess: true,
      };
    }

    // بارکد ناشناخته
    await this.prisma.productionScanLog.create({
      data: {
        barcode: trimmedBarcode,
        operatorName: dto.operatorName,
        stationCode: station,
        action: 'بارکد در سامانه یافت نشد',
        isSuccess: false,
      },
    });

    throw new NotFoundException(`بارکد «${trimmedBarcode}» در سیستم یافت نشد.`);
  }

  async getRecentScanLogs(limit = 20) {
    return this.prisma.productionScanLog.findMany({
      orderBy: { scannedAt: 'desc' },
      take: limit,
      include: {
        productionOrder: { select: { code: true } },
      },
    });
  }

  // ───────────────────────── گزارش جامع تولید (FlexERP Matrix Overview) ─────────────────────────
  async getComprehensiveProductionMatrix() {
    const orders = await this.prisma.productionOrder.findMany({
      where: { status: { not: 'COMPLETED' } },
      include: {
        product: { select: { name: true, sku: true } },
        cuttingListItems: true,
      },
      orderBy: { priority: 'desc' },
    });

    return orders.map((ord) => {
      const items = ord.cuttingListItems;
      const totalParts = items.length;
      const cutCount = items.filter((i) => i.isCut).length;
      const edgeCount = items.filter((i) => i.isEdged).length;
      const cncCount = items.filter((i) => i.isCncDone).length;
      const assembledCount = items.filter((i) => i.isAssembled).length;

      const progressPercent = totalParts > 0
        ? Math.round(((cutCount + edgeCount + cncCount + assembledCount) / (totalParts * 4)) * 100)
        : 0;

      return {
        id: ord.id,
        code: ord.code,
        productName: ord.product.name,
        targetQuantity: ord.targetQuantity,
        priority: ord.priority,
        status: ord.status,
        dueDate: ord.dueDate,
        customerType: ord.customerType || 'B2C',
        customerName: ord.customerName || 'مشتری مستقیم',
        endClientName: ord.endClientName || null,
        projectTitle: ord.projectTitle || 'پروژه کابینت / دکوراسیون',
        assignedInstaller: ord.assignedInstaller || 'نصاب تخصیص‌نیافته',
        installerPhone: ord.installerPhone || null,
        currentStage: ord.currentStage || 'CUTTING',
        totalParts,
        cutCount,
        edgeCount,
        cncCount,
        assembledCount,
        progressPercent,
      };
    });
  }

  // ───────────────────────── ثبت سفارش صنایع چوب دوگانه B2B/B2C ─────────────────────────
  async createWoodProductionOrder(dto: CreateWoodOrderDto) {
    const count = await this.prisma.productionOrder.count();
    const orderCode = dto.code || `WOOD-1404-${String(count + 1).padStart(4, '0')}`;

    let pId = dto.productId;
    if (!pId) {
      const existingProduct = await this.prisma.product.findFirst();
      if (existingProduct) {
        pId = existingProduct.id;
      } else {
        const newProd = await this.prisma.product.create({
          data: {
            sku: `WOOD-${Date.now().toString().slice(-6)}`,
            name: dto.projectTitle || 'یونیت دکوراسیون و کابینت سفارشی',
            unit: 'دست',
          },
        });
        pId = newProd.id;
      }
    }

    // یافتن یا ایجاد BOM پیش‌فرض برای این محصول
    let bom = await this.prisma.billOfMaterials.findFirst({
      where: { productId: pId },
    });

    if (!bom) {
      bom = await this.prisma.billOfMaterials.create({
        data: {
          code: `BOM-${orderCode}`,
          productId: pId,
          name: `ساختار محصول ${orderCode}`,
          quantity: 1,
        },
      });
    }

    return this.prisma.productionOrder.create({
      data: {
        code: orderCode,
        productId: pId,
        bomId: bom.id,
        targetQuantity: dto.targetQuantity ? Number(dto.targetQuantity) : 1,
        priority: dto.priority || 1,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: 'IN_PROGRESS',
        customerType: dto.customerType || 'B2C',
        customerName: dto.customerName || 'مشتری مستقیم',
        endClientName: dto.endClientName || null,
        projectTitle: dto.projectTitle || 'پروژه دکوراسیون و کابینت',
        assignedInstaller: dto.assignedInstaller || null,
        installerPhone: dto.installerPhone || null,
        currentStage: 'CUTTING',
        notes: dto.notes,
      },
      include: {
        product: true,
      },
    });
  }

  // ───────────────────────── ارتقای مرحله کارگاهی پرسنل (Shop-Floor Advance Stage) ─────────────────────────
  async advanceOrderStage(productionOrderId: string, dto: AdvanceStageDto) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
    });
    if (!order) throw new NotFoundException('سفارش تولید پیدا نشد.');

    const newStage = dto.stage.toUpperCase();
    const isFinished = newStage === 'COMPLETED' || newStage === 'INSTALLED';

    const updatedOrder = await this.prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        currentStage: newStage,
        status: isFinished ? 'COMPLETED' : 'IN_PROGRESS',
        actualEndDate: isFinished ? new Date() : undefined,
      },
    });

    // ثبت لاگ ممیزی کارگاه
    await this.prisma.productionScanLog.create({
      data: {
        productionOrderId,
        barcode: order.code,
        operatorName: dto.operatorName || 'اپراتور خط تولید',
        stationCode: newStage,
        action: `ارتقای وضعیت مرحله سفارش به ${newStage} توسط پرسنل`,
        isSuccess: true,
        message: dto.notes,
      },
    });

    return updatedOrder;
  }

  // ───────────────────────── استعلام آنی موجودی متریال و کسری (MTO Feasibility) ─────────────────────────
  async checkOrderMaterialsFeasibility(productionOrderId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        cuttingListItems: true,
        product: true,
      },
    });
    if (!order) throw new NotFoundException('سفارش تولید پیدا نشد.');

    // تجمیع متریال‌های مورد نیاز بر اساس قطعات برش
    const materialMap = new Map<string, number>();
    for (const item of order.cuttingListItems) {
      const key = item.materialType || 'ورق MDF خام/سفید ۱۶ میل';
      const cur = materialMap.get(key) || 0;
      materialMap.set(key, cur + (item.quantity || 1));
    }

    // اگر قطعه‌ای تعریف نشده، از نام محصول برای متریال نمونه استفاده شود
    if (materialMap.size === 0) {
      materialMap.set('ورق MDF سفید صابونی ۱۶ میل', 4);
      materialMap.set('ورق هایگلاس طوسی سوپرمات', 2);
      materialMap.set('لولا آرام‌بند ۴ پیچ پمپی', 24);
      materialMap.set('ریل سه تکه ساچمه‌ای ۵۰ سانت', 6);
    }

    // استعلام از موجودی WMS انبار
    const materialsResult: Array<{
      materialName: string;
      requiredQty: number;
      stockQty: number;
      shortageQty: number;
      status: 'AVAILABLE' | 'SHORTAGE';
    }> = [];

    let hasShortage = false;

    for (const [materialName, requiredQty] of materialMap.entries()) {
      // جستجوی کالا در موجودی انبار
      const inv = await this.prisma.inventory.findFirst({
        where: {
          product: {
            name: { contains: materialName.split(' ')[0], mode: 'insensitive' },
          },
          quantity: { gt: 0 },
        },
      });

      const stockQty = inv?.quantity || 0;
      const shortageQty = Math.max(0, requiredQty - stockQty);
      if (shortageQty > 0) hasShortage = true;

      materialsResult.push({
        materialName,
        requiredQty,
        stockQty,
        shortageQty,
        status: shortageQty === 0 ? 'AVAILABLE' : 'SHORTAGE',
      });
    }

    return {
      productionOrderId,
      orderCode: order.code,
      hasShortage,
      feasibilityStatus: hasShortage ? 'REQUIRES_PURCHASE' : 'READY_FOR_PRODUCTION',
      materials: materialsResult,
    };
  }

  // ───────────────────────── رسید ورود و بازرسی بار انبار (Inbound Goods Receipt) ─────────────────────────
  async getInboundReceipts(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return this.prisma.inboundReceipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async createInboundReceipt(dto: CreateInboundReceiptDto) {
    const count = await this.prisma.inboundReceipt.count();
    const receiptNumber = `GRN-1404-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.inboundReceipt.create({
      data: {
        receiptNumber,
        supplierName: dto.supplierName,
        driverName: dto.driverName,
        truckPlate: dto.truckPlate,
        waybillNumber: dto.waybillNumber,
        warehouseId: dto.warehouseId,
        status: 'PENDING_VERIFICATION',
        itemCount: dto.itemCount || (dto.items?.length ?? 0),
        itemsJson: dto.items as any,
        notes: dto.notes,
      },
      include: {
        warehouse: true,
      },
    });
  }

  async verifyInboundReceipt(id: string, dto: VerifyInboundReceiptDto) {
    const receipt = await this.prisma.inboundReceipt.findUnique({ where: { id } });
    if (!receipt) throw new NotFoundException('رسید ورود بار یافت نشد.');

    return this.prisma.inboundReceipt.update({
      where: { id },
      data: {
        status: dto.status,
        verifiedBy: dto.verifiedBy,
        verifiedAt: new Date(),
        notes: dto.notes ? `${receipt.notes || ''}\n${dto.notes}`.trim() : receipt.notes,
      },
      include: {
        warehouse: true,
      },
    });
  }

  // ───────────────────────── بارگیری، اعزام و نصب ─────────────────────────
  async getInstallationOrders() {
    return this.prisma.installationOrder.findMany({
      orderBy: { scheduledDate: 'desc' },
      include: { productionOrder: true },
    });
  }

  async createInstallationOrder(dto: CreateInstallationDto) {
    const count = await this.prisma.installationOrder.count();
    const orderNumber = `INST-1404-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.installationOrder.create({
      data: {
        orderNumber,
        productionOrderId: dto.productionOrderId || null,
        customerId: dto.customerId || null,
        projectAddress: dto.projectAddress,
        customerName: dto.customerName,
        contactPhone: dto.contactPhone,
        driverName: dto.driverName,
        installerLead: dto.installerLead,
        scheduledDate: new Date(dto.scheduledDate),
        status: 'SCHEDULED',
      },
    });
  }
}
