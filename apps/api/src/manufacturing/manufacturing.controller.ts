import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProductionOrderStatus, Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { ManufacturingService } from './manufacturing.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import {
  CompleteOrderDto,
  CreateProductionOrderDto,
  IssueMaterialsDto,
  RecordQualityCheckDto,
  UpdateOperationProgressDto,
} from './dto/create-production-order.dto';

@Controller('manufacturing')
@Roles(Role.ADMIN, Role.MANAGER)
export class ManufacturingController {
  constructor(private manufacturing: ManufacturingService) {}

  // ───────────────────────── ایستگاه‌های کاری ─────────────────────────

  @Post('workstations')
  async createWorkstation(@Body() dto: CreateWorkstationDto) {
    return this.manufacturing.createWorkstation(dto);
  }

  @Get('workstations')
  async listWorkstations() {
    return this.manufacturing.listWorkstations();
  }

  // ───────────────────────── فرمول‌های ساخت (BOM) ─────────────────────────

  @Post('boms')
  async createBom(@Body() dto: CreateBomDto) {
    return this.manufacturing.createBom(dto);
  }

  @Get('boms')
  async listBoms(
    @Query('productId') productId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.manufacturing.listBoms({
      productId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('boms/:id')
  async getBomById(@Param('id') id: string) {
    return this.manufacturing.getBomById(id);
  }

  // ───────────────────────── سفارشات تولید ─────────────────────────

  @Post('orders')
  async createOrder(@Body() dto: CreateProductionOrderDto) {
    return this.manufacturing.createOrder(dto);
  }

  @Get('orders')
  async listOrders(
    @Query('status') status?: ProductionOrderStatus,
    @Query('productId') productId?: string,
  ) {
    return this.manufacturing.listOrders({ status, productId });
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.manufacturing.getOrderById(id);
  }

  @Post('orders/:id/start')
  async startOrder(@Param('id') id: string) {
    return this.manufacturing.startOrder(id);
  }

  @Post('orders/:id/issue-materials')
  async issueMaterials(
    @Param('id') id: string,
    @Body() dto: IssueMaterialsDto,
  ) {
    return this.manufacturing.issueMaterials(id, dto);
  }

  @Post('orders/:id/operations/:opId')
  async updateOperation(
    @Param('id') id: string,
    @Param('opId') opId: string,
    @Body() dto: UpdateOperationProgressDto,
  ) {
    return this.manufacturing.updateOperation(id, opId, dto);
  }

  @Post('orders/:id/quality-check')
  async recordQualityCheck(
    @Param('id') id: string,
    @Body() dto: RecordQualityCheckDto,
  ) {
    return this.manufacturing.recordQualityCheck(id, dto);
  }

  @Post('orders/:id/complete')
  async completeOrder(
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
  ) {
    return this.manufacturing.completeOrder(id, dto);
  }
}
