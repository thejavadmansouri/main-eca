import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddRepairItemDto,
  CreateRepairOrderDto,
  SettleRepairDto,
  UpdateStatusDto,
} from './dto/repairs.dto';

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────── ثبت و دریافت برگه پذیرش ─────────────────────────
  async createRepairOrder(dto: CreateRepairOrderDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('مشتری مورد نظر یافت نشد.');

    // تولید شماره یکتای برگه پذیرش: REP-1404-0001
    const count = await this.prisma.repairOrder.count();
    const orderNumber = `REP-1404-${String(count + 1).padStart(4, '0')}`;

    const laborCost = dto.laborCost || 0;
    const depositPaid = dto.depositPaid || 0;
    const totalAmount = laborCost;
    const balanceDue = Math.max(0, totalAmount - depositPaid);

    return this.prisma.repairOrder.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        technicianId: dto.technicianId || null,
        deviceType: dto.deviceType,
        brandAndModel: dto.brandAndModel,
        serialNumber: dto.serialNumber,
        accessories: dto.accessories,
        customerProblem: dto.customerProblem,
        isUnderWarranty: dto.isUnderWarranty || false,
        warrantyExpireDate: dto.warrantyExpireDate ? new Date(dto.warrantyExpireDate) : null,
        estimatedReadyAt: dto.estimatedReadyAt ? new Date(dto.estimatedReadyAt) : null,
        laborCost,
        partsCost: 0,
        discountAmount: 0,
        totalAmount,
        depositPaid,
        balanceDue,
        notes: dto.notes,
        status: 'RECEIVED',
      },
      include: {
        customer: true,
        technician: true,
      },
    });
  }

  // ───────────────────────── فهرست برگه‌های پذیرش با فیلتر ─────────────────────────
  async getRepairOrders(query: {
    status?: string;
    search?: string;
    customerId?: string;
    technicianId?: string;
  }) {
    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.technicianId) {
      where.technicianId = query.technicianId;
    }
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { brandAndModel: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.repairOrder.findMany({
      where,
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getRepairOrderById(id: string) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('برگه پذیرش مورد نظر یافت نشد.');
    return order;
  }

  // ───────────────────────── به‌روزرسانی چرخه وضعیت تعمیرگاه ─────────────────────────
  async updateRepairStatus(id: string, dto: UpdateStatusDto) {
    const order = await this.prisma.repairOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('برگه پذیرش مورد نظر یافت نشد.');

    const validStatuses = [
      'RECEIVED',
      'DIAGNOSING',
      'ESTIMATED',
      'APPROVED',
      'REPAIRING',
      'QC_TESTING',
      'READY',
      'DELIVERED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException('وضعیت ارسالی نامعتبر است.');
    }

    const data: any = {
      status: dto.status,
    };
    if (dto.technicalReport !== undefined) data.technicalReport = dto.technicalReport;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.laborCost !== undefined) {
      data.laborCost = dto.laborCost;
      const totalAmount = dto.laborCost + order.partsCost - order.discountAmount;
      data.totalAmount = Math.max(0, totalAmount);
      data.balanceDue = Math.max(0, data.totalAmount - order.depositPaid);
    }
    if (dto.status === 'DELIVERED') {
      data.deliveredAt = new Date();
    }

    return this.prisma.repairOrder.update({
      where: { id },
      data,
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
    });
  }

  // ───────────────────────── افزودن قطعه یدکی مصرفی از انبار ─────────────────────────
  async addRepairItem(orderId: string, dto: AddRepairItemDto) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
      include: { repairItems: true },
    });
    if (!order) throw new NotFoundException('برگه پذیرش یافت نشد.');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('کالای قطعه یدکی یافت نشد.');

    const totalPrice = dto.quantity * dto.unitPrice;

    await this.prisma.repairItem.create({
      data: {
        repairOrderId: orderId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalPrice,
        hasOldPart: dto.hasOldPart ?? true,
      },
    });

    // محاسبه مجدد جمع قطعات و جمع کل فاکتور
    const updatedItems = await this.prisma.repairItem.findMany({ where: { repairOrderId: orderId } });
    const partsCost = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = Math.max(0, order.laborCost + partsCost - order.discountAmount);
    const balanceDue = Math.max(0, totalAmount - order.depositPaid);

    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        partsCost,
        totalAmount,
        balanceDue,
      },
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
    });
  }

  // ───────────────────────── حذف قطعه یدکی ─────────────────────────
  async removeRepairItem(orderId: string, itemId: string) {
    const item = await this.prisma.repairItem.findUnique({ where: { id: itemId } });
    if (!item || item.repairOrderId !== orderId) {
      throw new NotFoundException('آیتم قطعه یافت نشد.');
    }

    await this.prisma.repairItem.delete({ where: { id: itemId } });

    const order = await this.prisma.repairOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('برگه پذیرش یافت نشد.');

    const remainingItems = await this.prisma.repairItem.findMany({ where: { repairOrderId: orderId } });
    const partsCost = remainingItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const totalAmount = Math.max(0, order.laborCost + partsCost - order.discountAmount);
    const balanceDue = Math.max(0, totalAmount - order.depositPaid);

    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        partsCost,
        totalAmount,
        balanceDue,
      },
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
    });
  }

  // ───────────────────────── تسویه و ترخیص ─────────────────────────
  async settleRepairOrder(id: string, dto: SettleRepairDto) {
    const order = await this.prisma.repairOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('برگه پذیرش یافت نشد.');

    const discountAmount = dto.discountAmount ?? order.discountAmount;
    const depositPaid = dto.depositPaid ?? order.depositPaid;
    const totalAmount = Math.max(0, order.laborCost + order.partsCost - discountAmount);
    const balanceDue = Math.max(0, totalAmount - depositPaid);

    return this.prisma.repairOrder.update({
      where: { id },
      data: {
        discountAmount,
        depositPaid,
        totalAmount,
        balanceDue,
        notes: dto.notes ? `${order.notes || ''}\n${dto.notes}`.trim() : order.notes,
      },
      include: {
        customer: true,
        technician: true,
        repairItems: { include: { product: true } },
      },
    });
  }
}
