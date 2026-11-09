import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  CreateStageUpdateDto,
  ParametricBomDto,
  SaveCustomerSignatureDto,
  CreateProjectPostDto,
  AddPostCommentDto,
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
        customerPhone: true,
        currentStage: true,
        progressPercent: true,
        assignedInstaller: true,
        installerPhone: true,
        estimatedCompletionDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        contract: {
          select: {
            id: true,
            contractNumber: true,
            totalAmount: true,
            paidAmount: true,
            warrantyMonths: true,
            status: true,
          },
        },
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

    const contractWithSettlement = order.contract
      ? {
          ...order.contract,
          downPayment: order.contract.paidAmount,
          balanceDue: Math.max(0, order.contract.totalAmount - order.contract.paidAmount),
          isFullySettled: order.contract.paidAmount >= order.contract.totalAmount,
        }
      : null;

    return {
      ...order,
      contract: contractWithSettlement,
    };
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
    const orders = await this.prisma.productionOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
      include: {
        product: { select: { name: true, sku: true } },
        installationOrders: true,
        stageUpdates: {
          select: {
            id: true,
            stationCode: true,
            title: true,
            notes: true,
            photos: true,
            operatorName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            totalAmount: true,
            paidAmount: true,
            warrantyMonths: true,
            status: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      ...order,
      contract: order.contract
        ? {
            ...order.contract,
            downPayment: order.contract.paidAmount,
            balanceDue: Math.max(0, order.contract.totalAmount - order.contract.paidAmount),
            isFullySettled: order.contract.paidAmount >= order.contract.totalAmount,
          }
        : null,
    }));
  }

  /** ارسال پیامک حاوی لینک رهگیری زنده به مشتری */
  async sendTrackingLinkSms(orderId: string, customMobile?: string) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { product: true },
    });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد.');

    // ساخت توکن در صورتی که هنوز توکن نداشته باشد
    let token = order.trackingToken;
    if (!token) {
      token = randomUUID().replace(/-/g, '').slice(0, 12);
      await this.prisma.productionOrder.update({
        where: { id: orderId },
        data: { trackingToken: token },
      });
    }

    const recipientMobile = customMobile || order.customerPhone || '09120000000';
    const trackingUrl = `/track/${token}`;
    const smsMessage = `کارفرمای گرامی جناب ${order.customerName || 'مشتری'}\nسفارش شما با کد ${order.code} در کارگاه کاردو در حال آماده‌سازی است.\nجهت مشاهده پیشرفت لحظه‌ای و تصاویر تولید:\n${trackingUrl}\nکاردو OS`;

    this.logger.log(`📱 SMS Sent to ${recipientMobile}: ${smsMessage}`);

    await this.prisma.productionScanLog.create({
      data: {
        productionOrderId: order.id,
        barcode: order.code,
        operatorName: 'مدیریت پیگیری',
        stationCode: 'SMS_DISPATCH',
        action: 'ارسال لینک رهگیری به مشتری',
        message: `ارسال پیامک لینک رهگیری به شماره ${recipientMobile}`,
        isSuccess: true,
      },
    });

    return {
      success: true,
      mobile: recipientMobile,
      trackingUrl,
      token,
      message: smsMessage,
      sentAt: new Date().toISOString(),
    };
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
  async getProjectContract(idOrOrderId: string) {
    let contract = await this.prisma.projectContract.findUnique({
      where: { productionOrderId: idOrOrderId },
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

    if (!contract) {
      contract = await this.prisma.projectContract.findUnique({
        where: { id: idOrOrderId },
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
    }

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

  // ───────────────────────── موتور محاسبات BOM پارامتریک و فرموله ─────────────────────────
  calculateParametricBom(dto: ParametricBomDto) {
    const W = Number(dto.widthMm) || 900;
    const H = Number(dto.heightMm) || 720;
    const D = Number(dto.depthMm) || 550;
    const qty = Number(dto.quantity) || 1;
    const shelves = Number(dto.shelfCount) ?? 1;
    const doors = Number(dto.doorCount) ?? 2;
    const drawers = Number(dto.drawerCount) ?? 0;
    const bodyMat = dto.bodyMaterial || 'MDF سفید صابونی ۱۶ میل';
    const doorMat = dto.doorMaterial || 'هایگلاس AGT سفید براق';
    const edgeThick = dto.edgeThicknessMm || 2;

    const parts: Array<{
      partName: string;
      material: string;
      lengthMm: number;
      widthMm: number;
      thicknessMm: number;
      quantity: number;
      grainDirection: 'NONE' | 'LENGTHWISE' | 'WIDTHWISE';
      edgeL1?: boolean;
      edgeL2?: boolean;
      edgeW1?: boolean;
      edgeW2?: boolean;
    }> = [];

    // بدنه راست و چپ
    parts.push({
      partName: 'بدنه راست و چپ',
      material: bodyMat,
      lengthMm: H,
      widthMm: D,
      thicknessMm: 16,
      quantity: 2 * qty,
      grainDirection: 'LENGTHWISE',
      edgeL1: true,
      edgeL2: false,
      edgeW1: true,
      edgeW2: false,
    });

    // کف و طاق
    if (dto.unitType === 'WALL_CABINET' || dto.unitType === 'WARDROBE' || dto.unitType === 'TALL_CABINET') {
      parts.push({
        partName: 'کف و طاق یونیت',
        material: bodyMat,
        lengthMm: Math.max(100, W - 32),
        widthMm: D,
        thicknessMm: 16,
        quantity: 2 * qty,
        grainDirection: 'WIDTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
    } else {
      // کابینت زمینی (کف + ۲ عدد قید طاق)
      parts.push({
        partName: 'کف یونیت زمینی',
        material: bodyMat,
        lengthMm: Math.max(100, W - 32),
        widthMm: D,
        thicknessMm: 16,
        quantity: 1 * qty,
        grainDirection: 'WIDTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
      parts.push({
        partName: 'قیدهای اتصال طاق',
        material: bodyMat,
        lengthMm: Math.max(100, W - 32),
        widthMm: 80,
        thicknessMm: 16,
        quantity: 2 * qty,
        grainDirection: 'LENGTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
    }

    // طبقات متحرک
    if (shelves > 0) {
      parts.push({
        partName: 'طبقه متحرک میانی',
        material: bodyMat,
        lengthMm: Math.max(100, W - 34),
        widthMm: Math.max(100, D - 20),
        thicknessMm: 16,
        quantity: shelves * qty,
        grainDirection: 'WIDTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
    }

    // فیبر ۳ میل پشت‌بند
    parts.push({
      partName: 'فیبر ۳ میل پشت یونیت',
      material: 'فیبر ۳ میلیمتر سفید',
      lengthMm: Math.max(100, H - 4),
      widthMm: Math.max(100, W - 4),
      thicknessMm: 3,
      quantity: 1 * qty,
      grainDirection: 'NONE',
    });

    // درب‌ها
    if (doors > 0) {
      const singleDoorW = Math.round(W / doors) - 3;
      parts.push({
        partName: `درب نما (${doors > 1 ? 'دو لنگه' : 'تک لنگه'})`,
        material: doorMat,
        lengthMm: Math.max(100, H - 4),
        widthMm: Math.max(100, singleDoorW),
        thicknessMm: 16,
        quantity: doors * qty,
        grainDirection: 'LENGTHWISE',
        edgeL1: true,
        edgeL2: true,
        edgeW1: true,
        edgeW2: true,
      });
    }

    // قطعات کشو (اگر کشو تعریف شده باشد)
    if (drawers > 0) {
      parts.push({
        partName: 'دیواره چپ و راست کشو',
        material: bodyMat,
        lengthMm: Math.max(100, D - 50),
        widthMm: 140,
        thicknessMm: 16,
        quantity: 2 * drawers * qty,
        grainDirection: 'LENGTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
      parts.push({
        partName: 'پیشانی و پشت کشو',
        material: bodyMat,
        lengthMm: Math.max(100, W - 80),
        widthMm: 140,
        thicknessMm: 16,
        quantity: 2 * drawers * qty,
        grainDirection: 'WIDTHWISE',
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
      });
    }

    // محاسبات متراژ، تعداد ورق و نوار PVC
    let totalBodyAreaM2 = 0;
    let totalDoorAreaM2 = 0;
    let totalEdgeLengthMeters = 0;

    for (const p of parts) {
      const area = (p.lengthMm * p.widthMm * p.quantity) / 1000000;
      if (p.thicknessMm === 16 && p.material === bodyMat) {
        totalBodyAreaM2 += area;
      } else if (p.material === doorMat) {
        totalDoorAreaM2 += area;
      }

      // محاسبه متر نوار دور قطعه
      let edgesCount = 0;
      if (p.edgeL1) edgesCount += p.lengthMm;
      if (p.edgeL2) edgesCount += p.lengthMm;
      if (p.edgeW1) edgesCount += p.widthMm;
      if (p.edgeW2) edgesCount += p.widthMm;
      totalEdgeLengthMeters += (edgesCount * p.quantity) / 1000;
    }

    // متراژ مفید ورق استاندارد ام‌دی‌اف (3.66 * 1.83 = 6.7 m²) با ۱۵٪ دورریز
    const standardSheetAreaM2 = 3.66 * 1.83;
    const bodySheetsRequired = Math.ceil((totalBodyAreaM2 * 1.15) / standardSheetAreaM2);
    const doorSheetsRequired = Math.ceil((totalDoorAreaM2 * 1.15) / (2.8 * 1.22)); // ورق هایگلاس ۲.۸۰ * ۱.۲۲

    // لیست یراق‌آلات تخمینی
    const hardwareList = [
      { name: 'لولا آرام‌بند پمپی کلیپسی', quantity: doors * 2 * qty, unit: 'عدد' },
      { name: 'پایه کابینت ۱۰ یا ۱۴ سانتی قابل تنظیم', quantity: 4 * qty, unit: 'عدد' },
      { name: 'پیچ کانفرمات ۵ سانتی', quantity: 24 * qty, unit: 'عدد' },
      { name: 'پیچ ۴×۱۶ نوک تیز', quantity: 40 * qty, unit: 'عدد' },
      { name: 'دستگیره خطی مدرن', quantity: (doors + drawers) * qty, unit: 'عدد' },
      { name: 'ریل تلسکوپی سه زمانه ساچمه‌ای', quantity: drawers * qty, unit: 'دست' },
      { name: 'خار طبقه فلزی', quantity: shelves * 4 * qty, unit: 'عدد' },
    ];

    // برآورد هزینه به ریال
    const sheetCostBody = bodySheetsRequired * 18500000; // هر ورق بدنه ۱۸.۵ میلیون ریال
    const sheetCostDoor = doorSheetsRequired * 32000000; // هر ورق هایگلاس ۳۲ میلیون ریال
    const edgeTapeCost = Math.round(totalEdgeLengthMeters * 85000); // هر متر نوار ۲ میل ۸۵ هزار ریال
    const hardwareCost = (doors * 2 * 450000 + 4 * 120000 + 200000) * qty;
    const laborCost = Math.round((sheetCostBody + sheetCostDoor) * 0.35); // ۳۵ درصد دستمزد برش و ساخت
    const totalCost = sheetCostBody + sheetCostDoor + edgeTapeCost + hardwareCost + laborCost;
    const suggestedPrice = Math.round(totalCost * 1.3); // ۳۰ درصد حاشیه سود

    return {
      unitType: dto.unitType,
      dimensions: { widthMm: W, heightMm: H, depthMm: D, quantity: qty },
      parts,
      summary: {
        totalPartsCount: parts.reduce((s, p) => s + p.quantity, 0),
        totalBodyAreaM2: Number(totalBodyAreaM2.toFixed(2)),
        totalDoorAreaM2: Number(totalDoorAreaM2.toFixed(2)),
        totalEdgeLengthMeters: Number(totalEdgeLengthMeters.toFixed(1)),
        bodySheetsRequired,
        doorSheetsRequired,
        edgeTapeThicknessMm: edgeThick,
        hardwareList,
        financials: {
          materialCost: sheetCostBody + sheetCostDoor + edgeTapeCost + hardwareCost,
          laborCost,
          totalCost,
          suggestedPrice,
        },
      },
    };
  }

  /** انتقال مستقیم قطعات پارامتریک به پارت‌لیست سفارش کارگاهی */
  async applyParametricBomToOrder(orderId: string, dto: ParametricBomDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد.');

    const calculated = this.calculateParametricBom(dto);

    // ثبت تک‌تک قطعات در جدول cuttingListItem
    for (const p of calculated.parts) {
      const count = await this.prisma.cuttingListItem.count();
      const barcode = `CUT-${String(count + 1).padStart(5, '0')}`;

      await this.prisma.cuttingListItem.create({
        data: {
          productionOrderId: orderId,
          partName: p.partName,
          materialType: p.material,
          lengthMm: p.lengthMm,
          widthMm: p.widthMm,
          thicknessMm: p.thicknessMm,
          quantity: p.quantity,
          grainDirection: p.grainDirection,
          edgeL1: p.edgeL1 ? 'PVC_2MM' : null,
          edgeL2: p.edgeL2 ? 'PVC_2MM' : null,
          edgeW1: p.edgeW1 ? 'PVC_2MM' : null,
          edgeW2: p.edgeW2 ? 'PVC_2MM' : null,
          barcode,
        },
      });
    }

    return {
      message: `${calculated.parts.length} ردیف قطعه پارامتریک با موفقیت به پارت‌لیست سفارش اضافه گردید.`,
      addedPartsCount: calculated.parts.length,
      orderId,
    };
  }

  /** صدور فایل استاندارد خروجی دستگاه برش Cut Rite / OptiCut CSV */
  async exportCutRiteCsv(orderId: string): Promise<string> {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { cuttingListItems: true },
    });
    if (!order) throw new NotFoundException('سفارش تولید پیدا نشد.');

    const headers = [
      'OrderCode',
      'PartName',
      'Material',
      'Length_mm',
      'Width_mm',
      'Thickness_mm',
      'Quantity',
      'GrainDirection',
      'Edge_L1',
      'Edge_L2',
      'Edge_W1',
      'Edge_W2',
      'Barcode',
      'Customer',
    ];

    const rows = order.cuttingListItems.map((item) => [
      order.code,
      `"${item.partName.replace(/"/g, '""')}"`,
      `"${item.materialType.replace(/"/g, '""')}"`,
      item.lengthMm,
      item.widthMm,
      item.thicknessMm,
      item.quantity,
      item.grainDirection,
      item.edgeL1 || '-',
      item.edgeL2 || '-',
      item.edgeW1 || '-',
      item.edgeW2 || '-',
      item.barcode,
      `"${(order.customerName || 'مشتری').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return '\uFEFF' + csvContent; // اضافه کردن BOM برای باز شدن صحیح فارسی در اکسل
  }

  /** ثبت امضای الکترونیکی دیجیتال لمسی کارفرما در محل تحویل/نصب */
  async saveCustomerSignature(orderId: string, dto: SaveCustomerSignatureDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('سفارش تولید یافت نشد.');

    const now = new Date();

    const updated = await this.prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        customerSignatureData: dto.signatureData,
        customerSignedAt: now,
        currentStage: 'INSTALLED',
        progressPercent: 100,
      },
    });

    // ثبت در حواله نصب مربوطه
    await this.prisma.installationOrder.updateMany({
      where: { productionOrderId: orderId },
      data: {
        customerSignature: true,
        customerSignatureData: dto.signatureData,
        customerSignedAt: now,
        status: 'COMPLETED',
        actualCompletedDate: now,
        completionNotes: dto.notes || 'تایید نهایی و اخذ امضای رضایت کارفرما در محل',
      },
    });

    // ثبت در خط سیر کارگاهی
    await this.prisma.productionStageUpdate.create({
      data: {
        productionOrderId: orderId,
        stationCode: 'INSTALLED',
        title: 'امضای رضایت و تحویل نهایی پروژه توسط کارفرما',
        notes: `کارفرما (${dto.signerName || order.customerName || 'مشتری'}) رضایت کامل خود را با امضای دیجیتال ثبت نمود.${dto.notes ? ` توضیحات: ${dto.notes}` : ''}`,
        photos: [dto.signatureData],
        operatorName: 'تاییدیه مستقیم کارفرما',
      },
    });

    return {
      success: true,
      orderCode: order.code,
      signedAt: now,
      message: 'امضای الکترونیکی با موفقیت ثبت و سفارش به وضعیت تحویل قطعی تغییر یافت.',
    };
  }

  /** ثبت امضا از طریق توکن عمومی رهگیری */
  async savePublicSignature(token: string, dto: SaveCustomerSignatureDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { trackingToken: token } });
    if (!order) throw new NotFoundException('لینک رهگیری نامعتبر است.');
    return this.saveCustomerSignature(order.id, dto);
  }

  // ───────────────────────── پوستر کاردو (نمایشگاه و گالری پروژه‌های اجرا شده) ─────────────────────────
  async getProjectPosts() {
    return this.prisma.projectPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        productionOrder: {
          select: {
            code: true,
            customerName: true,
            projectTitle: true,
          },
        },
      },
    });
  }

  async createProjectPost(dto: CreateProjectPostDto) {
    return this.prisma.projectPost.create({
      data: {
        productionOrderId: dto.productionOrderId || null,
        title: dto.title,
        description: dto.description,
        installerName: dto.installerName || 'سرپرست تیم نصب کاردو',
        category: dto.category || 'CABINET',
        photos: dto.photos || [],
      },
    });
  }

  async likeProjectPost(id: string) {
    return this.prisma.projectPost.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    });
  }

  async addPostComment(id: string, dto: AddPostCommentDto) {
    const post = await this.prisma.projectPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('پست پروژه پیدا نشد.');

    return this.prisma.projectPostComment.create({
      data: {
        postId: id,
        author: dto.author,
        role: dto.role || 'کاربر سیستم',
        text: dto.text,
      },
    });
  }
}
