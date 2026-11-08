export class CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  managerName?: string;
}

export class CreateEmployeeDto {
  personnelCode: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthCertificate?: string;
  fatherName?: string;
  birthDate?: string;
  mobile: string;
  address?: string;
  insuranceNumber?: string;
  bankAccount?: string;
  iban?: string;
  maritalStatus?: string;
  childrenCount?: number;
  jobTitle: string;
  departmentId?: string;
  userId?: string;
}

export class CreateContractDto {
  contractNumber: string;
  employeeId: string;
  contractType?: string;
  startDate: string;
  endDate?: string;
  baseDailySalary: number;
  baseMonthlySalary: number;
  housingAllowance?: number;
  groceryAllowance?: number;
  childAllowancePerChild?: number;
  maritalAllowance?: number;
  specialAllowance?: number;
}

export class CalculateSlipDto {
  periodId: string;
  employeeId: string;
  workingDays?: number;
  overtimeHours?: number;
  delayHours?: number;
  leaveDays?: number;
  absenceDays?: number;
  loanDeductions?: number;
  otherDeductions?: number;
}

export class CreatePayrollPeriodDto {
  year: number;
  month: number;
  title?: string;
}
