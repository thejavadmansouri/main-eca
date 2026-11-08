import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import {
  AddCuttingItemDto,
  AddProfileGlassDto,
  CreateInstallationDto,
  ProcessScanDto,
} from './dto/wood-industry.dto';
import { WoodIndustryService } from './wood-industry.service';

@Controller('wood-industry')
@Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
export class WoodIndustryController {
  constructor(private readonly woodService: WoodIndustryService) {}

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

  // ───────────────────────── بارگیری، اعزام و نصب ─────────────────────────
  @Get('installations')
  async getInstallationOrders() {
    return this.woodService.getInstallationOrders();
  }

  @Post('installations')
  async createInstallationOrder(@Body() dto: CreateInstallationDto) {
    return this.woodService.createInstallationOrder(dto);
  }
}
