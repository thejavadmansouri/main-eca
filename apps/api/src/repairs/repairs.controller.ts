import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import {
  AddRepairItemDto,
  CreateRepairOrderDto,
  SettleRepairDto,
  UpdateStatusDto,
} from './dto/repairs.dto';
import { RepairsService } from './repairs.service';

@Controller('repairs')
@Roles(Role.ADMIN, Role.MANAGER, Role.SALES)
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Get()
  async getRepairOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.repairsService.getRepairOrders({
      status,
      search,
      customerId,
      technicianId,
    });
  }

  @Get(':id')
  async getRepairOrderById(@Param('id') id: string) {
    return this.repairsService.getRepairOrderById(id);
  }

  @Post()
  async createRepairOrder(@Body() dto: CreateRepairOrderDto) {
    return this.repairsService.createRepairOrder(dto);
  }

  @Patch(':id/status')
  async updateRepairStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.repairsService.updateRepairStatus(id, dto);
  }

  @Post(':id/items')
  async addRepairItem(
    @Param('id') id: string,
    @Body() dto: AddRepairItemDto,
  ) {
    return this.repairsService.addRepairItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  async removeRepairItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.repairsService.removeRepairItem(id, itemId);
  }

  @Patch(':id/settle')
  async settleRepairOrder(
    @Param('id') id: string,
    @Body() dto: SettleRepairDto,
  ) {
    return this.repairsService.settleRepairOrder(id, dto);
  }
}
