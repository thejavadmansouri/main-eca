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
  CalculateSlipDto,
  CreateContractDto,
  CreateDepartmentDto,
  CreateEmployeeDto,
  CreatePayrollPeriodDto,
} from './dto/hr.dto';
import { HrService } from './hr.service';

@Controller('hr')
@Roles(Role.ADMIN, Role.MANAGER)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ───────────────────────── واحدهای سازمانی ─────────────────────────
  @Get('departments')
  async getDepartments() {
    return this.hrService.getDepartments();
  }

  @Post('departments')
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.hrService.createDepartment(dto);
  }

  // ───────────────────────── پرسنل و کارگزینی ─────────────────────────
  @Get('employees')
  async getEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.hrService.getEmployees(departmentId, search);
  }

  @Get('employees/:id')
  async getEmployeeById(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Post('contracts')
  async createContract(@Body() dto: CreateContractDto) {
    return this.hrService.createContract(dto);
  }

  // ───────────────────────── دوره‌ها و فیش‌های حقوقی ─────────────────────────
  @Get('payroll-periods')
  async getPayrollPeriods() {
    return this.hrService.getPayrollPeriods();
  }

  @Post('payroll-periods')
  async createPayrollPeriod(
    @Body() body: CreatePayrollPeriodDto,
  ) {
    return this.hrService.createPayrollPeriod(body.year, body.month, body.title);
  }

  @Get('payroll-periods/:id/slips')
  async getPayrollSlips(@Param('id') periodId: string) {
    return this.hrService.getPayrollSlips(periodId);
  }

  @Post('payroll-slips/calculate')
  async calculatePayrollSlip(@Body() dto: CalculateSlipDto) {
    return this.hrService.calculatePayrollSlip(dto);
  }
}
