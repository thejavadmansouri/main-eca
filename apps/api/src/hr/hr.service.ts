import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculateSlipDto,
  CreateContractDto,
  CreateDepartmentDto,
  CreateEmployeeDto,
} from './dto/hr.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────── دپارتمان‌ها و ساختار سازمانی ─────────────────────────
  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: { select: { employees: true } },
      },
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { OR: [{ code: dto.code }, { name: dto.name }] },
    });
    if (existing) {
      throw new BadRequestException('واحد سازمانی با این نام یا کد قبلاً تعریف شده است.');
    }
    return this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        managerName: dto.managerName,
      },
    });
  }

  // ───────────────────────── پرونده پرسنلی ─────────────────────────
  async getEmployees(departmentId?: string, search?: string) {
    const where: any = { isActive: true };
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { personnelCode: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        contracts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { personnelCode: 'asc' },
    });
  }

  async getEmployeeById(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        contracts: { orderBy: { createdAt: 'desc' } },
        payrollSlips: {
          include: { period: true },
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });
    if (!emp) throw new NotFoundException('پرسنل مورد نظر یافت نشد.');
    return emp;
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const dup = await this.prisma.employee.findFirst({
      where: { OR: [{ personnelCode: dto.personnelCode }, { nationalId: dto.nationalId }] },
    });
    if (dup) {
      throw new BadRequestException('کد پرسنلی یا کد ملی تکراری است.');
    }
    return this.prisma.employee.create({
      data: {
        personnelCode: dto.personnelCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        birthCertificate: dto.birthCertificate,
        fatherName: dto.fatherName,
        birthDate: dto.birthDate,
        mobile: dto.mobile,
        address: dto.address,
        insuranceNumber: dto.insuranceNumber,
        bankAccount: dto.bankAccount,
        iban: dto.iban,
        maritalStatus: dto.maritalStatus || 'SINGLE',
        childrenCount: dto.childrenCount || 0,
        jobTitle: dto.jobTitle,
        departmentId: dto.departmentId || null,
        userId: dto.userId || null,
      },
      include: { department: true },
    });
  }

  // ───────────────────────── احکام کارگزینی ─────────────────────────
  async createContract(dto: CreateContractDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('پرسنل یافت نشد.');

    // غیرفعال کردن احکام قبلی این پرسنل
    await this.prisma.employeeContract.updateMany({
      where: { employeeId: dto.employeeId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.employeeContract.create({
      data: {
        contractNumber: dto.contractNumber,
        employeeId: dto.employeeId,
        contractType: dto.contractType || 'FIXED_TERM',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        baseDailySalary: dto.baseDailySalary,
        baseMonthlySalary: dto.baseMonthlySalary,
        housingAllowance: dto.housingAllowance ?? 9000000,
        groceryAllowance: dto.groceryAllowance ?? 14000000,
        childAllowancePerChild: dto.childAllowancePerChild ?? 7166184,
        maritalAllowance: dto.maritalAllowance ?? 5000000,
        specialAllowance: dto.specialAllowance ?? 0,
        isActive: true,
      },
    });
  }

  // ───────────────────────── دوره‌های حقوق و دستمزد ─────────────────────────
  async getPayrollPeriods() {
    return this.prisma.payrollPeriod.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        _count: { select: { slips: true } },
      },
    });
  }

  async createPayrollPeriod(year: number, month: number, title?: string) {
    const existing = await this.prisma.payrollPeriod.findUnique({
      where: { year_month: { year, month } },
    });
    if (existing) {
      throw new BadRequestException(`دوره حقوق ماه ${month} سال ${year} قبلاً ایجاد شده است.`);
    }
    const defaultTitle = title || `حقوق و دستمزد ماه ${month} - ${year}`;
    return this.prisma.payrollPeriod.create({
      data: {
        year,
        month,
        title: defaultTitle,
        status: 'DRAFT',
      },
    });
  }

  // ───────────────────────── موتور محاسبه فیش حقوقی مطابق قانون کار ایران ─────────────────────────
  async calculatePayrollSlip(dto: CalculateSlipDto) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: dto.periodId } });
    if (!period) throw new NotFoundException('دوره حقوق یافت نشد.');

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: {
        contracts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!employee) throw new NotFoundException('پرسنل یافت نشد.');

    const contract = employee.contracts[0];
    if (!contract) {
      throw new BadRequestException('برای این پرسنل حکم کارگزینی فعال ثبت نشده است.');
    }

    const workingDays = dto.workingDays ?? 30;
    const overtimeHours = dto.overtimeHours ?? 0;
    const delayHours = dto.delayHours ?? 0;
    const leaveDays = dto.leaveDays ?? 0;
    const absenceDays = dto.absenceDays ?? 0;
    const loanDeductions = dto.loanDeductions ?? 0;
    const otherDeductions = dto.otherDeductions ?? 0;

    // ۱. دستمزد پایه کارکرد ماهانه
    const baseDaily = contract.baseDailySalary > 0 
      ? contract.baseDailySalary 
      : contract.baseMonthlySalary / 30;
    const baseSalaryEarned = Math.round(baseDaily * workingDays);

    // ۲. مزایای مصوب قانون کار به نسبت کارکرد
    const prorateRatio = Math.min(workingDays / 30, 1.0);
    const housingAllowance = Math.round(contract.housingAllowance * prorateRatio);
    const groceryAllowance = Math.round(contract.groceryAllowance * prorateRatio);

    // ۳. حق اولاد (معاف از بیمه طبق قانون تأمین اجتماعی)
    const childAllowance = employee.childrenCount > 0
      ? Math.round(contract.childAllowancePerChild * employee.childrenCount * prorateRatio)
      : 0;

    // ۴. حق عائله‌مندی و تأهل
    const maritalAllowance = employee.maritalStatus === 'MARRIED'
      ? Math.round(contract.maritalAllowance * prorateRatio)
      : 0;

    // ۵. اضافه‌کاری: نرخ هر ساعت = (حقوق پایه ماهانه / ۲۲۰ ساعت) * ۱.۴
    const hourlyBaseRate = contract.baseMonthlySalary / 220;
    const overtimeHourlyRate = hourlyBaseRate * 1.4;
    const overtimePay = Math.round(overtimeHours * overtimeHourlyRate);

    // ۶. فوق‌العاده ویژه
    const specialAllowance = Math.round(contract.specialAllowance * prorateRatio);

    // ۷. جمع ناخالص حقوق و مزایا
    const totalGrossSalary =
      baseSalaryEarned +
      housingAllowance +
      groceryAllowance +
      childAllowance +
      maritalAllowance +
      overtimePay +
      specialAllowance;

    // ۸. پایه مشمول بیمه تأمین اجتماعی (حق اولاد معاف است)
    const insurableEarnings =
      baseSalaryEarned +
      housingAllowance +
      groceryAllowance +
      maritalAllowance +
      overtimePay +
      specialAllowance;

    // ۹. کسورات بیمه: ۷٪ سهم کارگر، ۲۳٪ سهم کارفرما (۲۰٪ + ۳٪ بیکاری)
    const workerInsurance = Math.round(insurableEarnings * 0.07);
    const employerInsurance = Math.round(insurableEarnings * 0.23);

    // ۱۰. مالیات بر درآمد حقوق (ماده ۸۴: معافیت ماهانه تا سقف ۱۲ میلیون تومان معادل ۱۲۰ میلیون ریال)
    const taxExemptionMonthly = 120000000; // ریال
    const taxableEarnings = Math.max(0, totalGrossSalary - workerInsurance - taxExemptionMonthly);
    const incomeTax = taxableEarnings > 0 ? Math.round(taxableEarnings * 0.1) : 0; // ۱۰٪ پله اول

    // ۱۱. جمع کسورات و خالص دریافتی
    const totalDeductions = workerInsurance + incomeTax + loanDeductions + otherDeductions;
    const netPayable = Math.max(0, totalGrossSalary - totalDeductions);
    const totalEmployerCost = totalGrossSalary + employerInsurance;

    // ثبت یا به‌روزرسانی فیش در دیتابیس
    const slip = await this.prisma.payrollSlip.upsert({
      where: {
        periodId_employeeId: {
          periodId: dto.periodId,
          employeeId: dto.employeeId,
        },
      },
      create: {
        periodId: dto.periodId,
        employeeId: dto.employeeId,
        workingDays,
        overtimeHours,
        delayHours,
        leaveDays,
        absenceDays,
        baseSalaryEarned,
        housingAllowance,
        groceryAllowance,
        childAllowance,
        maritalAllowance,
        overtimePay,
        bonusAndPerks: specialAllowance,
        totalGrossSalary,
        workerInsurance,
        employerInsurance,
        incomeTax,
        loanDeductions,
        otherDeductions,
        totalDeductions,
        netPayable,
        totalEmployerCost,
        status: 'CONFIRMED',
      },
      update: {
        workingDays,
        overtimeHours,
        delayHours,
        leaveDays,
        absenceDays,
        baseSalaryEarned,
        housingAllowance,
        groceryAllowance,
        childAllowance,
        maritalAllowance,
        overtimePay,
        bonusAndPerks: specialAllowance,
        totalGrossSalary,
        workerInsurance,
        employerInsurance,
        incomeTax,
        loanDeductions,
        otherDeductions,
        totalDeductions,
        netPayable,
        totalEmployerCost,
        status: 'CONFIRMED',
      },
      include: {
        employee: { include: { department: true } },
        period: true,
      },
    });

    // به‌روزرسانی جمع‌های کل دوره
    await this.updatePeriodAggregates(dto.periodId);

    return slip;
  }

  private async updatePeriodAggregates(periodId: string) {
    const slips = await this.prisma.payrollSlip.findMany({ where: { periodId } });
    const totalGrossPay = slips.reduce((sum, s) => sum + s.totalGrossSalary, 0);
    const totalNetPay = slips.reduce((sum, s) => sum + s.netPayable, 0);
    const totalWorkerInsurance = slips.reduce((sum, s) => sum + s.workerInsurance, 0);
    const totalEmployerInsurance = slips.reduce((sum, s) => sum + s.employerInsurance, 0);
    const totalIncomeTax = slips.reduce((sum, s) => sum + s.incomeTax, 0);

    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        totalGrossPay,
        totalNetPay,
        totalWorkerInsurance,
        totalEmployerInsurance,
        totalIncomeTax,
        slipsCount: slips.length,
      },
    });
  }

  async getPayrollSlips(periodId: string) {
    return this.prisma.payrollSlip.findMany({
      where: { periodId },
      include: {
        employee: { include: { department: true } },
      },
      orderBy: { employee: { personnelCode: 'asc' } },
    });
  }
}
