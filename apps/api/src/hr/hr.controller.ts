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
  BatchCalculateSlipsDto,
  CalculateSlipDto,
  CreateContractDto,
  CreateDepartmentDto,
  CreateEmployeeDto,
  CreatePayrollPeriodDto,
  UpdateContractDto,
  UpdateDepartmentDto,
  UpdateEmployeeDto,
} from './dto/hr.dto';
import { HrService } from './hr.service';

@Controller('hr')
@Roles(Role.ADMIN, Role.MANAGER)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ───────────────────────── آمار و شاخص‌های کلیدی ─────────────────────────
  @Get('stats')
  async getHrStats() {
    return this.hrService.getHrSummaryStats();
  }

  // ───────────────────────── واحدهای سازمانی ─────────────────────────
  @Get('departments')
  async getDepartments() {
    return this.hrService.getDepartments();
  }

  @Post('departments')
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.hrService.createDepartment(dto);
  }

  @Patch('departments/:id')
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.hrService.updateDepartment(id, dto);
  }

  // ───────────────────────── پرسنل و پرونده کارگزینی ─────────────────────────
  @Get('employees')
  async getEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.hrService.getEmployees(departmentId, search, activeBool);
  }

  @Get('employees/:id')
  async getEmployeeById(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Patch('employees/:id')
  async updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  async deleteEmployee(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  // ───────────────────────── احکام کارگزینی (Staff Decrees) ─────────────────────────
  @Get('contracts')
  async getContracts(
    @Query('employeeId') employeeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.hrService.getContracts(employeeId, activeBool);
  }

  @Get('contracts/:id')
  async getContractById(@Param('id') id: string) {
    return this.hrService.getContractById(id);
  }

  @Post('contracts')
  async createContract(@Body() dto: CreateContractDto) {
    return this.hrService.createContract(dto);
  }

  @Patch('contracts/:id')
  async updateContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.hrService.updateContract(id, dto);
  }

  @Delete('contracts/:id')
  async deleteContract(@Param('id') id: string) {
    return this.hrService.deleteContract(id);
  }

  // ───────────────────────── دوره‌ها و فیش‌های حقوقی ─────────────────────────
  @Get('payroll-periods')
  async getPayrollPeriods() {
    return this.hrService.getPayrollPeriods();
  }

  @Post('payroll-periods')
  async createPayrollPeriod(@Body() body: CreatePayrollPeriodDto) {
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

  @Post('payroll-slips/batch')
  async batchCalculatePayrollSlip(@Body() dto: BatchCalculateSlipsDto) {
    return this.hrService.batchCalculatePayroll(dto.periodId, dto.defaultWorkingDays);
  }
}
