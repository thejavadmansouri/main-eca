import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddCuttingItemDto,
  AddProfileGlassDto,
  CreateInstallationDto,
  UpdateInstallationStatusDto,
  ProcessScanDto,
  CreateWoodOrderDto,
  AdvanceStageDto,
  CreateInboundReceiptDto,
  VerifyInboundReceiptDto,
  CreateProjectContractDto,
  RecordProjectPaymentDto,
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
  async getInstallationOrders(customerId?: string) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    return this.prisma.installationOrder.findMany({
      where,
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

  async updateInstallationStatus(id: string, dto: UpdateInstallationStatusDto) {
    const inst = await this.prisma.installationOrder.findUnique({
      where: { id },
      include: { productionOrder: true },
    });
    if (!inst) throw new NotFoundException('سفارش نصب مورد نظر یافت نشد.');

    const isCompleted = dto.status === 'COMPLETED';

    const updated = await this.prisma.installationOrder.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.completionNotes !== undefined && { completionNotes: dto.completionNotes }),
        ...(dto.customerSignature !== undefined && { customerSignature: dto.customerSignature }),
        ...(isCompleted && { actualCompletedDate: new Date() }),
      },
      include: { productionOrder: true },
    });

    // در صورت تکمیل نصب، وضعیت مرحله سفارش تولید به INSTALLED تغییر می‌یابد
    if (isCompleted && inst.productionOrderId) {
      await this.prisma.productionOrder.update({
        where: { id: inst.productionOrderId },
        data: {
          currentStage: 'INSTALLED',
          progressPercent: 100,
          status: 'COMPLETED',
          actualEndDate: new Date(),
        },
      });

      await this.prisma.productionScanLog.create({
        data: {
          productionOrderId: inst.productionOrderId,
          barcode: inst.orderNumber,
          operatorName: inst.installerLead || 'تیم نصب کاردو',
          stationCode: 'INSTALL',
          action: 'اتمام نصب و تحویل پروژه به کارفرما',
          message: dto.completionNotes || 'تکمیل موفقیت‌آمیز نصب در محل پروژه',
        },
      });
    }

    return updated;
  }

  /** تولید و دریافت توکن رهگیری اختصاصی برای مشتری/کارفرما */
  async generateTrackingToken(orderId: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('سفارش تولید مورد نظر یافت نشد.');

    let token = order.trackingToken;
    if (!token) {
      token = 'tr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      await this.prisma.productionOrder.update({
        where: { id: orderId },
        data: { trackingToken: token },
      });
    }

    return { trackingToken: token, url: `/track/${token}` };
  }

  /** دریافت اطلاعات عمومی پیشرفت سفارش جهت نمایش به کارفرما */
  async getPublicTracking(token: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { trackingToken: token },
      select: {
        id: true,
        code: true,
        projectTitle: true,
        customerName: true,
        currentStage: true,
        progressPercent: true,
        assignedInstaller: true,
        installerPhone: true,
        estimatedCompletionDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        scanLogs: {
          orderBy: { scannedAt: 'asc' },
          select: {
            stationCode: true,
            action: true,
            scannedAt: true,
          },
        },
        installationOrders: {
          select: {
            orderNumber: true,
            status: true,
            scheduledDate: true,
            actualCompletedDate: true,
            installerLead: true,
            driverName: true,
          },
        },
        stageUpdates: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            stationCode: true,
            title: true,
            notes: true,
            photos: true,
            operatorName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('سفارش یا لینک رهگیری نامعتبر است.');
    }

    return order;
  }

  /** به‌روزرسانی نوار پیشرفت و تاریخ تخمینی اتمام توسط مدیر/سرپرست */
  async updateOrderProgress(orderId: string, dto: { progressPercent: number; estimatedCompletionDate?: string }) {
    return this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        progressPercent: Math.min(100, Math.max(0, dto.progressPercent)),
        ...(dto.estimatedCompletionDate && { estimatedCompletionDate: new Date(dto.estimatedCompletionDate) }),
      },
    });
  }

  /** لیست سفارشات تولید با امکان فیلتر بر اساس مشتری */
  async getOrders(params?: { customerName?: string; limit?: number }) {
    const where: any = {};
    if (params?.customerName) {
      where.OR = [
        { customerName: { contains: params.customerName, mode: 'insensitive' } },
        { endClientName: { contains: params.customerName, mode: 'insensitive' } },
      ];
    }
    return this.prisma.productionOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
      include: {
        product: { select: { name: true, sku: true } },
        installationOrders: true,
      },
    });
  }

  /** دریافت جزئیات یک سفارش تولید */
  async getOrderById(id: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        cuttingListItems: true,
        scanLogs: { orderBy: { scannedAt: 'desc' } },
        stageUpdates: { orderBy: { createdAt: 'desc' } },
        installationOrders: true,
        contract: { include: { milestones: true, payments: true } },
      },
    });
    if (!order) throw new NotFoundException('سفارش تولید مورد نظر یافت نشد.');
    return order;
  }

  /** ثبت عکس‌ها و یادداشت‌های مرحله پیشرفت تولید */
  async addStageUpdate(orderId: string, dto: {
    stationCode: string;
    title: string;
    notes?: string;
    photos?: string[];
    operatorName?: string;
    advanceStage?: boolean;
  }) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('سفارش تولید مورد نظر یافت نشد.');

    const update = await this.prisma.productionStageUpdate.create({
      data: {
        productionOrderId: orderId,
        stationCode: dto.stationCode,
        title: dto.title,
        notes: dto.notes,
        photos: dto.photos || [],
        operatorName: dto.operatorName || 'سرپرست کارگاه',
      },
    });

    // ثبت در لاگ اسکن خط جهت همگامی تاریخچه
    await this.prisma.productionScanLog.create({
      data: {
        productionOrderId: orderId,
        barcode: order.code,
        operatorName: dto.operatorName || 'سرپرست خط',
        stationCode: dto.stationCode,
        action: dto.title,
        message: dto.notes,
        isSuccess: true,
      },
    });

    // در صورت انتخاب ارتقای خودکار مرحله
    if (dto.advanceStage) {
      await this.prisma.productionOrder.update({
        where: { id: orderId },
        data: { currentStage: dto.stationCode },
      });
    }

    return update;
  }

  /** دریافت تمام یادداشت‌ها و عکس‌های مراحل یک سفارش */
  async getStageUpdates(orderId: string) {
    return this.prisma.productionStageUpdate.findMany({
      where: { productionOrderId: orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ───────────────────────── قرارداد پروژه‌ها و پرداخت‌های مرحله‌ای (Project Contracts & Milestones) ─────────────────────────
  async getProjectContract(productionOrderId: string) {
    const contract = await this.prisma.projectContract.findUnique({
      where: { productionOrderId },
      include: {
        productionOrder: {
          include: { product: true },
        },
        milestones: {
          orderBy: { stepNumber: 'asc' },
          include: { payments: true },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });
    if (!contract) return null;

    // بررسی سررسید اقساط بر اساس مرحله جاری خط تولید
    const currentStage = contract.productionOrder.currentStage || 'CUTTING';
    const stageRank: Record<string, number> = {
      CUTTING: 1,
      EDGE_BANDING: 2,
      CNC: 3,
      ASSEMBLY: 4,
      PAINTING: 5,
      QC_PACKING: 6,
      INSTALLATION: 7,
      COMPLETED: 8,
    };
    const currentRank = stageRank[currentStage] || 1;

    let hasStageBlock = false;
    let blockReason: string | null = null;

    for (const ms of contract.milestones) {
      if (ms.dueStage) {
        const msRank = stageRank[ms.dueStage] || 1;
        if (currentRank >= msRank && ms.status !== 'PAID') {
          hasStageBlock = true;
          blockReason = `سفارش در مرحله ${currentStage} است اما قسط «${ms.title}» هنوز تسویه نشده است.`;
          break;
        }
      }
    }

    return {
      ...contract,
      hasStageBlock,
      blockReason,
      remainingAmount: Math.max(0, contract.totalAmount - contract.paidAmount - contract.discount),
    };
  }

  async getAllProjectContracts() {
    return this.prisma.projectContract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        productionOrder: {
          include: { product: true },
        },
        milestones: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  async createOrUpdateProjectContract(dto: CreateProjectContractDto) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: dto.productionOrderId },
    });
    if (!order) throw new NotFoundException('سفارش تولید پیدا نشد.');

    const totalAmount = Number(dto.totalAmount) || 0;
    const discount = Number(dto.discount) || 0;
    const tax = Number(dto.tax) || 0;
    const payableTotal = Math.max(0, totalAmount - discount + tax);

    // اقساط پیش‌فرض سه مرحله‌ای استاندارد: ۳۰٪ پیش‌پرداخت، ۴۰٪ مونتاژ، ۳۰٪ نصب و تحویل
    const milestonesData = (dto.milestones && dto.milestones.length > 0)
      ? dto.milestones
      : [
          {
            stepNumber: 1,
            title: 'قسط اول: پیش‌پرداخت عقد قرارداد و شروع برش‌کاری',
            percentage: 30,
            amount: Math.round(payableTotal * 0.3),
            dueStage: 'CUTTING',
            notes: 'پیش‌پرداخت جهت خرید ورق و شروع خط اره',
          },
          {
            stepNumber: 2,
            title: 'قسط دوم: اتمام ماشین‌کاری CNC و مونتاژ یونیت‌ها',
            percentage: 40,
            amount: Math.round(payableTotal * 0.4),
            dueStage: 'ASSEMBLY',
            notes: 'تسویه قبل از خروج یونیت‌ها از کارگاه و اعزام',
          },
          {
            stepNumber: 3,
            title: 'قسط سوم: تسویه نهایی، تحویل پروژه و نصب کامل',
            percentage: 30,
            amount: Math.round(payableTotal * 0.3),
            dueStage: 'INSTALLATION',
            notes: 'تسویه کامل همزمان با رضایت‌نامه تحویل کلید',
          },
        ];

    let contract = await this.prisma.projectContract.findUnique({
      where: { productionOrderId: dto.productionOrderId },
    });

    if (contract) {
      // ویرایش قرارداد موجود
      contract = await this.prisma.projectContract.update({
        where: { id: contract.id },
        data: {
          totalAmount,
          discount,
          tax,
          terms: dto.terms,
          warrantyMonths: dto.warrantyMonths || 12,
        },
      });

      // بازتعریف اقساط در صورتی که پرداختی نداشته باشند
      const paidMilestones = await this.prisma.projectMilestone.count({
        where: { contractId: contract.id, paidAmount: { gt: 0 } },
      });
      if (paidMilestones === 0) {
        await this.prisma.projectMilestone.deleteMany({
          where: { contractId: contract.id },
        });
        for (const ms of milestonesData) {
          await this.prisma.projectMilestone.create({
            data: {
              contractId: contract.id,
              stepNumber: ms.stepNumber,
              title: ms.title,
              percentage: ms.percentage,
              amount: ms.amount,
              dueStage: ms.dueStage || null,
              notes: ms.notes || null,
              dueDate: ms.dueDate ? new Date(ms.dueDate) : null,
              status: 'PENDING',
            },
          });
        }
      }
    } else {
      // ایجاد قرارداد جدید
      const count = await this.prisma.projectContract.count();
      const contractNumber = `CONT-1404-${String(count + 1).padStart(4, '0')}`;

      contract = await this.prisma.projectContract.create({
        data: {
          contractNumber,
          productionOrderId: dto.productionOrderId,
          totalAmount,
          discount,
          tax,
          terms: dto.terms || 'تعهدات ساخت طبق نقشه و مشخصات تأییدشده. گارانتی شامل یراق‌آلات و نوارهای PVC.',
          warrantyMonths: dto.warrantyMonths || 12,
          signedAt: new Date(),
          status: 'ACTIVE',
          milestones: {
            create: milestonesData.map((ms) => ({
              stepNumber: ms.stepNumber,
              title: ms.title,
              percentage: ms.percentage,
              amount: ms.amount,
              dueStage: ms.dueStage || null,
              notes: ms.notes || null,
              dueDate: ms.dueDate ? new Date(ms.dueDate) : null,
              status: 'PENDING',
            })),
          },
        },
      });
    }

    return this.getProjectContract(dto.productionOrderId);
  }

  async recordProjectPayment(dto: RecordProjectPaymentDto) {
    const contract = await this.prisma.projectContract.findUnique({
      where: { id: dto.contractId },
      include: { milestones: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!contract) throw new NotFoundException('قرارداد پروژه پیدا نشد.');

    const paymentAmount = Number(dto.amount) || 0;
    if (paymentAmount <= 0) throw new BadRequestException('مبلغ پرداخت باید بزرگ‌تر از صفر باشد.');

    // ثبت پرداخت
    const payment = await this.prisma.projectPayment.create({
      data: {
        contractId: dto.contractId,
        milestoneId: dto.milestoneId || null,
        amount: paymentAmount,
        method: dto.method || 'TRANSFER',
        trackingCode: dto.trackingCode || null,
        chequeNumber: dto.chequeNumber || null,
        chequeDueDate: dto.chequeDueDate ? new Date(dto.chequeDueDate) : null,
        chequeBank: dto.chequeBank || null,
        verifiedBy: dto.verifiedBy || 'امور مالی کاردو',
        notes: dto.notes || null,
      },
    });

    // تخصیص مبلغ به قسط مشخص یا تسویه ترتیبی اقساط
    let targetMilestoneId = dto.milestoneId;
    if (!targetMilestoneId) {
      const openMilestone = contract.milestones.find((m) => m.status !== 'PAID');
      if (openMilestone) targetMilestoneId = openMilestone.id;
    }

    if (targetMilestoneId) {
      const ms = await this.prisma.projectMilestone.findUnique({ where: { id: targetMilestoneId } });
      if (ms) {
        const newPaid = ms.paidAmount + paymentAmount;
        const isFullyPaid = newPaid >= ms.amount;
        await this.prisma.projectMilestone.update({
          where: { id: targetMilestoneId },
          data: {
            paidAmount: newPaid,
            status: isFullyPaid ? 'PAID' : 'DUE',
            paidAt: isFullyPaid ? new Date() : ms.paidAt,
          },
        });
      }
    }

    // به‌روزرسانی جمع کل پرداختی قرارداد
    const allPayments = await this.prisma.projectPayment.findMany({
      where: { contractId: dto.contractId },
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const isContractDone = totalPaid >= (contract.totalAmount - contract.discount);

    await this.prisma.projectContract.update({
      where: { id: dto.contractId },
      data: {
        paidAmount: totalPaid,
        status: isContractDone ? 'COMPLETED' : 'ACTIVE',
      },
    });

    return this.getProjectContract(contract.productionOrderId);
  }
}
