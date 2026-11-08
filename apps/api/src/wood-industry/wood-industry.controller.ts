import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
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
} from './dto/wood-industry.dto';
import { WoodIndustryService } from './wood-industry.service';

@Controller('wood-industry')
@Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
export class WoodIndustryController {
  constructor(private readonly woodService: WoodIndustryService) {}

  // ───────────────────────── ثبت و مدیریت سفارش صنایع چوب (B2B / B2C) ─────────────────────────
  @Get('orders')
  async getOrders(@Query('customerName') customerName?: string) {
    return this.woodService.getOrders({ customerName });
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.woodService.getOrderById(id);
  }

  @Post('orders')
  async createWoodProductionOrder(@Body() dto: CreateWoodOrderDto) {
    return this.woodService.createWoodProductionOrder(dto);
  }

  @Post('orders/:id/advance-stage')
  async advanceOrderStage(
    @Param('id') id: string,
    @Body() dto: AdvanceStageDto,
  ) {
    return this.woodService.advanceOrderStage(id, dto);
  }

  @Post('orders/:id/tracking-token')
  async generateTrackingToken(@Param('id') id: string) {
    return this.woodService.generateTrackingToken(id);
  }

  @Patch('orders/:id/progress')
  async updateOrderProgress(
    @Param('id') id: string,
    @Body() dto: { progressPercent: number; estimatedCompletionDate?: string },
  ) {
    return this.woodService.updateOrderProgress(id, dto);
  }

  @Get('orders/:id/stage-updates')
  async getStageUpdates(@Param('id') orderId: string) {
    return this.woodService.getStageUpdates(orderId);
  }

  @Post('orders/:id/stage-updates')
  async addStageUpdate(
    @Param('id') orderId: string,
    @Body() dto: CreateStageUpdateDto,
  ) {
    return this.woodService.addStageUpdate(orderId, dto);
  }

  @Public()
  @Get('public/track/:token')
  async getPublicTracking(@Param('token') token: string) {
    return this.woodService.getPublicTracking(token);
  }

  @Get('orders/:id/feasibility')
  async checkOrderMaterialsFeasibility(@Param('id') id: string) {
    return this.woodService.checkOrderMaterialsFeasibility(id);
  }

  // ───────────────────────── لیست برش قطعات ─────────────────────────
  @Get('orders/:id/cutting-list')
  async getCuttingList(@Param('id') orderId: string) {
    return this.woodService.getCuttingList(orderId);
  }

  @Post('cutting-list')
  async addCuttingItem(@Body() dto: AddCuttingItemDto) {
    return this.woodService.addCuttingItem(dto);
  }

  // ───────────────────────── پروفیل و شیشه ─────────────────────────
  @Get('orders/:id/profiles')
  async getWoodProfiles(@Param('id') orderId: string) {
    return this.woodService.getWoodProfiles(orderId);
  }

  @Post('profiles')
  async addWoodProfile(@Body() dto: AddProfileGlassDto) {
    return this.woodService.addWoodProfile(dto);
  }

  // ───────────────────────── اسکن بارکد کارگاهی (Scan Monitor) ─────────────────────────
  @Post('scan')
  async processShopFloorScan(@Body() dto: ProcessScanDto) {
    return this.woodService.processShopFloorScan(dto);
  }

  @Get('scans/recent')
  async getRecentScanLogs(@Query('limit') limit?: string) {
    return this.woodService.getRecentScanLogs(limit ? parseInt(limit, 10) : 20);
  }

  // ───────────────────────── گزارش جامع تولید (FlexERP Matrix Overview) ─────────────────────────
  @Get('matrix-report')
  async getComprehensiveProductionMatrix() {
    return this.woodService.getComprehensiveProductionMatrix();
  }

  // ───────────────────────── رسید ورود و بازرسی بار انبار (Inbound Goods Receipt) ─────────────────────────
  @Get('inbound-receipts')
  async getInboundReceipts(@Query('warehouseId') warehouseId?: string) {
    return this.woodService.getInboundReceipts(warehouseId);
  }

  @Post('inbound-receipts')
  async createInboundReceipt(@Body() dto: CreateInboundReceiptDto) {
    return this.woodService.createInboundReceipt(dto);
  }

  @Post('inbound-receipts/:id/verify')
  async verifyInboundReceipt(
    @Param('id') id: string,
    @Body() dto: VerifyInboundReceiptDto,
  ) {
    return this.woodService.verifyInboundReceipt(id, dto);
  }

  // ───────────────────────── بارگیری، اعزام و نصب ─────────────────────────
  @Get('installations')
  async getInstallationOrders(@Query('customerId') customerId?: string) {
    return this.woodService.getInstallationOrders(customerId);
  }

  @Post('installations')
  async createInstallationOrder(@Body() dto: CreateInstallationDto) {
    return this.woodService.createInstallationOrder(dto);
  }

  @Patch('installations/:id/status')
  async updateInstallationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInstallationStatusDto,
  ) {
    return this.woodService.updateInstallationStatus(id, dto);
  }

  // ───────────────────────── قرارداد پروژه‌ها و پرداخت‌های مرحله‌ای ─────────────────────────
  @Get('contracts')
  async getAllProjectContracts() {
    return this.woodService.getAllProjectContracts();
  }

  @Get('orders/:id/contract')
  async getProjectContract(@Param('id') orderId: string) {
    return this.woodService.getProjectContract(orderId);
  }

  @Post('contracts')
  async createOrUpdateProjectContract(@Body() dto: CreateProjectContractDto) {
    return this.woodService.createOrUpdateProjectContract(dto);
  }

  @Post('contracts/payments')
  async recordProjectPayment(@Body() dto: RecordProjectPaymentDto) {
    return this.woodService.recordProjectPayment(dto);
  }
}
