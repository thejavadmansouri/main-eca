import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculateSlipDto,
  CreateContractDto,
  CreateDepartmentDto,
  CreateEmployeeDto,
  UpdateContractDto,
  UpdateDepartmentDto,
  UpdateEmployeeDto,
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

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const dep = await this.prisma.department.findUnique({ where: { id } });
    if (!dep) throw new NotFoundException('واحد سازمانی یافت نشد.');
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.managerName !== undefined && { managerName: dto.managerName }),
      },
    });
  }

  // ───────────────────────── پرونده پرسنلی ─────────────────────────
  async getEmployees(departmentId?: string, search?: string, isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { personnelCode: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        contracts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { contracts: true, payrollSlips: true } },
      },
      orderBy: { personnelCode: 'asc' },
    });
  }

  async getEmployeeById(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            workTasksAssigned: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                kind: true,
                status: true,
                priority: true,
                note: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        contracts: { orderBy: { createdAt: 'desc' } },
        payrollSlips: {
          include: { period: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
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
        emergencyPhone: dto.emergencyPhone,
        bloodType: dto.bloodType,
        gender: dto.gender || 'MALE',
        militaryStatus: dto.militaryStatus,
        address: dto.address,
        insuranceNumber: dto.insuranceNumber,
        bankAccount: dto.bankAccount,
        iban: dto.iban,
        maritalStatus: dto.maritalStatus || 'SINGLE',
        childrenCount: dto.childrenCount || 0,
        jobTitle: dto.jobTitle,
        departmentId: dto.departmentId || null,
        userId: dto.userId || null,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        notes: dto.notes,
      },
      include: { department: true },
    });
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('پرسنل مورد نظر یافت نشد.');

    if (dto.nationalId && dto.nationalId !== emp.nationalId) {
      const dup = await this.prisma.employee.findFirst({
        where: { nationalId: dto.nationalId, id: { not: id } },
      });
      if (dup) throw new BadRequestException('کد ملی وارد شده متعلق به شخص دیگری است.');
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.nationalId && { nationalId: dto.nationalId }),
        ...(dto.birthCertificate !== undefined && { birthCertificate: dto.birthCertificate }),
        ...(dto.fatherName !== undefined && { fatherName: dto.fatherName }),
        ...(dto.birthDate !== undefined && { birthDate: dto.birthDate }),
        ...(dto.mobile && { mobile: dto.mobile }),
        ...(dto.emergencyPhone !== undefined && { emergencyPhone: dto.emergencyPhone }),
        ...(dto.bloodType !== undefined && { bloodType: dto.bloodType }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.militaryStatus !== undefined && { militaryStatus: dto.militaryStatus }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.insuranceNumber !== undefined && { insuranceNumber: dto.insuranceNumber }),
        ...(dto.bankAccount !== undefined && { bankAccount: dto.bankAccount }),
        ...(dto.iban !== undefined && { iban: dto.iban }),
        ...(dto.maritalStatus !== undefined && { maritalStatus: dto.maritalStatus }),
        ...(dto.childrenCount !== undefined && { childrenCount: dto.childrenCount }),
        ...(dto.jobTitle && { jobTitle: dto.jobTitle }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId || null }),
        ...(dto.userId !== undefined && { userId: dto.userId || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.hireDate && { hireDate: new Date(dto.hireDate) }),
        ...(dto.terminationDate !== undefined && {
          terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { department: true },
    });
  }

  async deleteEmployee(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { contracts: true, payrollSlips: true } } },
    });
    if (!emp) throw new NotFoundException('پرسنل یافت نشد.');

    // در صورتی که فیش یا قرارداد دارد، به صورت نرم غیرفعال شود تا سوابق حسابداری مخدوش نشود
    if (emp._count.contracts > 0 || emp._count.payrollSlips > 0) {
      return this.prisma.employee.update({
        where: { id },
        data: { isActive: false, terminationDate: new Date() },
      });
    }

    return this.prisma.employee.delete({ where: { id } });
  }

  // ───────────────────────── احکام کارگزینی (Staff Decrees) ─────────────────────────
  async getContracts(employeeId?: string, isActive?: boolean) {
    const where: any = {};
    if (employeeId && employeeId !== 'ALL') where.employeeId = employeeId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.employeeContract.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getContractById(id: string) {
    const contract = await this.prisma.employeeContract.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
    if (!contract) throw new NotFoundException('حکم کارگزینی یافت نشد.');
    return contract;
  }

  async createContract(dto: CreateContractDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('پرسنل یافت نشد.');

    // بررسی تکراری نبودن شماره حکم
    const existing = await this.prisma.employeeContract.findUnique({
      where: { contractNumber: dto.contractNumber },
    });
    if (existing) {
      throw new BadRequestException('شماره حکم کارگزینی تکراری است.');
    }

    // غیرفعال کردن احکام قبلی این پرسنل در صورت صدور حکم جدید
    await this.prisma.employeeContract.updateMany({
      where: { employeeId: dto.employeeId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.employeeContract.create({
      data: {
        contractNumber: dto.contractNumber,
        employeeId: dto.employeeId,
        contractType: dto.contractType || 'FIXED_TERM',
        decreeType: dto.decreeType || 'INITIAL',
        decreeTitle: dto.decreeTitle || `حکم کارگزینی ${employee.firstName} ${employee.lastName}`,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        baseDailySalary: dto.baseDailySalary,
        baseMonthlySalary: dto.baseMonthlySalary,
        housingAllowance: dto.housingAllowance ?? 9000000,
        groceryAllowance: dto.groceryAllowance ?? 14000000,
        childAllowancePerChild: dto.childAllowancePerChild ?? 7166184,
        maritalAllowance: dto.maritalAllowance ?? 5000000,
        seniorityAllowance: dto.seniorityAllowance ?? 0,
        responsibilityAllowance: dto.responsibilityAllowance ?? 0,
        specialAllowance: dto.specialAllowance ?? 0,
        educationDegree: dto.educationDegree,
        notes: dto.notes,
        isActive: true,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
  }

  async updateContract(id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('حکم کارگزینی یافت نشد.');

    return this.prisma.employeeContract.update({
      where: { id },
      data: {
        ...(dto.contractType && { contractType: dto.contractType }),
        ...(dto.decreeType && { decreeType: dto.decreeType }),
        ...(dto.decreeTitle && { decreeTitle: dto.decreeTitle }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.issueDate && { issueDate: new Date(dto.issueDate) }),
        ...(dto.baseDailySalary !== undefined && { baseDailySalary: dto.baseDailySalary }),
        ...(dto.baseMonthlySalary !== undefined && { baseMonthlySalary: dto.baseMonthlySalary }),
        ...(dto.housingAllowance !== undefined && { housingAllowance: dto.housingAllowance }),
        ...(dto.groceryAllowance !== undefined && { groceryAllowance: dto.groceryAllowance }),
        ...(dto.childAllowancePerChild !== undefined && {
          childAllowancePerChild: dto.childAllowancePerChild,
        }),
        ...(dto.maritalAllowance !== undefined && { maritalAllowance: dto.maritalAllowance }),
        ...(dto.seniorityAllowance !== undefined && { seniorityAllowance: dto.seniorityAllowance }),
        ...(dto.responsibilityAllowance !== undefined && {
          responsibilityAllowance: dto.responsibilityAllowance,
        }),
        ...(dto.specialAllowance !== undefined && { specialAllowance: dto.specialAllowance }),
        ...(dto.educationDegree !== undefined && { educationDegree: dto.educationDegree }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        employee: { include: { department: true } },
      },
    });
  }

  async deleteContract(id: string) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('حکم کارگزینی یافت نشد.');
    return this.prisma.employeeContract.delete({ where: { id } });
  }

  // ───────────────────────── آمار و شاخص‌های کلیدی منابع انسانی (HR KPIs) ─────────────────────────
  async getHrSummaryStats() {
    const [employees, contracts, departments] = await Promise.all([
      this.prisma.employee.findMany({ select: { id: true, isActive: true, insuranceNumber: true, departmentId: true } }),
      this.prisma.employeeContract.findMany({
        where: { isActive: true },
        select: {
          baseMonthlySalary: true,
          housingAllowance: true,
          groceryAllowance: true,
          maritalAllowance: true,
          childAllowancePerChild: true,
          seniorityAllowance: true,
          responsibilityAllowance: true,
          specialAllowance: true,
        },
      }),
      this.prisma.department.findMany({ select: { id: true, name: true, _count: { select: { employees: true } } } }),
    ]);

    const totalActiveEmployees = employees.filter((e) => e.isActive).length;
    const totalInactiveEmployees = employees.filter((e) => !e.isActive).length;
    const insuredCount = employees.filter((e) => e.isActive && !!e.insuranceNumber).length;

    let totalMonthlyPayrollCost = 0;
    contracts.forEach((c) => {
      totalMonthlyPayrollCost +=
        c.baseMonthlySalary +
        c.housingAllowance +
        c.groceryAllowance +
        c.maritalAllowance +
        c.seniorityAllowance +
        c.responsibilityAllowance +
        c.specialAllowance;
    });

    const averageSalary = contracts.length > 0 ? Math.round(totalMonthlyPayrollCost / contracts.length) : 0;

    return {
      totalActiveEmployees,
      totalInactiveEmployees,
      totalDepartments: departments.length,
      totalActiveContracts: contracts.length,
      insuredCount,
      totalMonthlyPayrollCost,
      averageSalary,
      departmentBreakdown: departments.map((d) => ({
        id: d.id,
        name: d.name,
        count: d._count.employees,
      })),
    };
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
    const baseDaily =
      contract.baseDailySalary > 0
        ? contract.baseDailySalary
        : contract.baseMonthlySalary / 30;
    const baseSalaryEarned = Math.round(baseDaily * workingDays);

    // ۲. مزایای مصوب قانون کار به نسبت کارکرد
    const prorateRatio = Math.min(workingDays / 30, 1.0);
    const housingAllowance = Math.round(contract.housingAllowance * prorateRatio);
    const groceryAllowance = Math.round(contract.groceryAllowance * prorateRatio);

    // ۳. حق اولاد (معاف از بیمه طبق قانون تأمین اجتماعی)
    const childAllowance =
      employee.childrenCount > 0
        ? Math.round(contract.childAllowancePerChild * employee.childrenCount * prorateRatio)
        : 0;

    // ۴. حق عائله‌مندی و تأهل
    const maritalAllowance =
      employee.maritalStatus === 'MARRIED'
        ? Math.round(contract.maritalAllowance * prorateRatio)
        : 0;

    // ۵. پایه سنوات و حق مسئولیت
    const seniorityAllowance = Math.round((contract.seniorityAllowance || 0) * prorateRatio);
    const responsibilityAllowance = Math.round((contract.responsibilityAllowance || 0) * prorateRatio);

    // ۶. اضافه‌کاری: نرخ هر ساعت = (حقوق پایه ماهانه / ۲۲۰ ساعت) * ۱.۴
    const hourlyBaseRate = contract.baseMonthlySalary / 220;
    const overtimeHourlyRate = hourlyBaseRate * 1.4;
    const overtimePay = Math.round(overtimeHours * overtimeHourlyRate);

    // ۷. فوق‌العاده ویژه
    const specialAllowance = Math.round((contract.specialAllowance || 0) * prorateRatio);

    // ۸. جمع ناخالص حقوق و مزایا
    const totalGrossSalary =
      baseSalaryEarned +
      housingAllowance +
      groceryAllowance +
      childAllowance +
      maritalAllowance +
      seniorityAllowance +
      responsibilityAllowance +
      overtimePay +
      specialAllowance;

    // ۹. پایه مشمول بیمه تأمین اجتماعی (حق اولاد معاف است)
    const insurableEarnings =
      baseSalaryEarned +
      housingAllowance +
      groceryAllowance +
      maritalAllowance +
      seniorityAllowance +
      responsibilityAllowance +
      overtimePay +
      specialAllowance;

    // ۱۰. کسورات بیمه: ۷٪ سهم کارگر، ۲۳٪ سهم کارفرما (۲۰٪ + ۳٪ بیکاری)
    const workerInsurance = Math.round(insurableEarnings * 0.07);
    const employerInsurance = Math.round(insurableEarnings * 0.23);

    // ۱۱. مالیات بر درآمد حقوق (ماده ۸۴: معافیت ماهانه تا سقف ۱۲ میلیون تومان معادل ۱۲۰ میلیون ریال)
    const taxExemptionMonthly = 120000000; // ریال
    const taxableEarnings = Math.max(0, totalGrossSalary - workerInsurance - taxExemptionMonthly);
    const incomeTax = taxableEarnings > 0 ? Math.round(taxableEarnings * 0.1) : 0; // ۱۰٪ پله اول

    // ۱۲. جمع کسورات و خالص دریافتی
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
        bonusAndPerks: specialAllowance + seniorityAllowance + responsibilityAllowance,
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
        bonusAndPerks: specialAllowance + seniorityAllowance + responsibilityAllowance,
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

  // ───────────────────────── محاسبه دسته‌ای کلیه پرسنل در یک دوره ─────────────────────────
  async batchCalculatePayroll(periodId: string, defaultWorkingDays = 30) {
    const activeEmployees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        contracts: { some: { isActive: true } },
      },
      select: { id: true },
    });

    const results = [];
    for (const emp of activeEmployees) {
      const slip = await this.calculatePayrollSlip({
        periodId,
        employeeId: emp.id,
        workingDays: defaultWorkingDays,
      });
      results.push(slip);
    }

    return {
      message: `فیش حقوقی ${results.length} نفر از پرسنل با موفقیت محاسبه و صادر شد.`,
      count: results.length,
    };
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
