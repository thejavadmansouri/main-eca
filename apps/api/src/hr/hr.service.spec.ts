import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HrService } from './hr.service';

describe('HrService', () => {
  let service: HrService;

  const mockDepartment = {
    id: 'dep-1',
    name: 'واحد فنی و مهندسی',
    code: 'DEP-ENG',
    description: 'طراحی، تولید و پشتیبانی فنی',
  };

  const mockEmployee = {
    id: 'emp-1',
    personnelCode: 'EMP-1001',
    firstName: 'علی',
    lastName: 'رضایی',
    nationalId: '0012345678',
    mobile: '09120000000',
    maritalStatus: 'MARRIED',
    childrenCount: 2,
    jobTitle: 'کارشناس ارشد تولید',
    departmentId: 'dep-1',
    contracts: [
      {
        id: 'cnt-1',
        contractNumber: 'CNT-1403-01',
        employeeId: 'emp-1',
        baseDailySalary: 3000000, // ۳ میلیون ریال روزانه
        baseMonthlySalary: 90000000, // ۹۰ میلیون ریال ماهانه
        housingAllowance: 9000000, // ۹ میلیون ریال
        groceryAllowance: 14000000, // ۱۴ میلیون ریال
        childAllowancePerChild: 7166184, // به ازای هر فرزند
        maritalAllowance: 5000000, // ۵ میلیون ریال
        specialAllowance: 10000000, // ۱۰ میلیون ریال
        isActive: true,
      },
    ],
  };

  const mockPeriod = {
    id: 'period-1',
    year: 1403,
    month: 8,
    title: 'حقوق و دستمزد آبان ۱۴۰۳',
    status: 'DRAFT',
  };

  const mockPrisma = {
    department: {
      findMany: jest.fn().mockResolvedValue([mockDepartment]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'dep-new', ...args.data })),
    },
    employee: {
      findMany: jest.fn().mockResolvedValue([mockEmployee]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(mockEmployee),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'emp-new', ...args.data })),
    },
    employeeContract: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'cnt-new', ...args.data })),
    },
    payrollPeriod: {
      findMany: jest.fn().mockResolvedValue([mockPeriod]),
      findUnique: jest.fn().mockResolvedValue(mockPeriod),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'period-new', ...args.data })),
      update: jest.fn().mockResolvedValue(mockPeriod),
    },
    payrollSlip: {
      upsert: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'slip-1', ...args.create })),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    jest.clearAllMocks();
  });

  it('باید لیست دپارتمان‌ها و ساختار سازمانی را برگرداند', async () => {
    mockPrisma.department.findMany.mockResolvedValue([mockDepartment]);
    const deps = await service.getDepartments();
    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('واحد فنی و مهندسی');
  });

  it('باید کارمند جدید را با اعتبارسنجی ثبت نماید', async () => {
    mockPrisma.employee.findFirst.mockResolvedValue(null);
    mockPrisma.employee.create.mockResolvedValue(mockEmployee);

    const emp = await service.createEmployee({
      personnelCode: 'EMP-1001',
      firstName: 'علی',
      lastName: 'رضایی',
      nationalId: '0012345678',
      mobile: '09120000000',
      jobTitle: 'کارشناس ارشد تولید',
    });

    expect(emp.personnelCode).toBe('EMP-1001');
    expect(mockPrisma.employee.create).toHaveBeenCalled();
  });

  it('باید فیش حقوقی را مطابق با قانون کار ایران دقیق محاسبه کند', async () => {
    mockPrisma.payrollPeriod.findUnique.mockResolvedValue(mockPeriod);
    mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
    mockPrisma.payrollSlip.findMany.mockResolvedValue([]);

    const slip = await service.calculatePayrollSlip({
      periodId: 'period-1',
      employeeId: 'emp-1',
      workingDays: 30,
      overtimeHours: 20, // ۲۰ ساعت اضافه کاری
    });

    // ۱. کارکرد پایه ۳۰ روز * ۳ میلیون = ۹۰ میلیون
    expect(slip.baseSalaryEarned).toBe(90000000);
    // ۲. حق مسکن و بن خواربار کامل
    expect(slip.housingAllowance).toBe(9000000);
    expect(slip.groceryAllowance).toBe(14000000);
    // ۳. حق اولاد برای ۲ فرزند: ۲ * ۷۱۶۶۱۸۴ = ۱۴۳۳۲۳۶۸
    expect(slip.childAllowance).toBe(14332368);
    // ۴. حق عائله‌مندی برای فرد متأهل
    expect(slip.maritalAllowance).toBe(5000000);
    // ۵. نرخ اضافه‌کاری: (۹۰ میلیون / ۲۲۰) * ۱.۴ * ۲۰ = ۱۱۴۵۴۵۴۵ ریال
    expect(slip.overtimePay).toBeGreaterThan(11000000);
    // ۶. بیمه کارگری ۷٪ و بیمه کارفرما ۲۳٪
    expect(slip.workerInsurance).toBeGreaterThan(0);
    expect(slip.employerInsurance).toBeGreaterThan(slip.workerInsurance * 3);
    // ۷. خالص پرداختی = ناخالص منهای کسورات
    expect(slip.netPayable).toBe(slip.totalGrossSalary - slip.totalDeductions);
    expect(slip.totalEmployerCost).toBe(slip.totalGrossSalary + slip.employerInsurance);
  });
});
