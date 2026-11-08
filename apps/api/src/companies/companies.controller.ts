import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private service: CompaniesService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.SALES)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() dto: any) {
    return this.service.createBranch(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/fiscal-years')
  createFiscalYear(@Param('id') id: string, @Body() dto: any) {
    return this.service.createFiscalYear(id, dto);
  }
}
