export class CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  managerName?: string;
}

export class UpdateDepartmentDto {
  name?: string;
  code?: string;
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
  emergencyPhone?: string;
  bloodType?: string;
  gender?: string;
  militaryStatus?: string;
  address?: string;
  insuranceNumber?: string;
  bankAccount?: string;
  iban?: string;
  maritalStatus?: string;
  childrenCount?: number;
  jobTitle: string;
  departmentId?: string;
  userId?: string;
  hireDate?: string;
  notes?: string;
}

export class UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  birthCertificate?: string;
  fatherName?: string;
  birthDate?: string;
  mobile?: string;
  emergencyPhone?: string;
  bloodType?: string;
  gender?: string;
  militaryStatus?: string;
  address?: string;
  insuranceNumber?: string;
  bankAccount?: string;
  iban?: string;
  maritalStatus?: string;
  childrenCount?: number;
  jobTitle?: string;
  departmentId?: string;
  userId?: string;
  isActive?: boolean;
  hireDate?: string;
  terminationDate?: string;
  notes?: string;
}

export class CreateContractDto {
  contractNumber: string;
  employeeId: string;
  contractType?: string; // FIXED_TERM, PERMANENT, PROBATION, CONTRACTOR
  decreeType?: string; // INITIAL, ANNUAL_INCREASE, PROMOTION, TITLE_CHANGE, TRANSFER, RENEWAL, TERMINATION
  decreeTitle?: string;
  startDate: string;
  endDate?: string;
  issueDate?: string;
  baseDailySalary: number;
  baseMonthlySalary: number;
  housingAllowance?: number;
  groceryAllowance?: number;
  childAllowancePerChild?: number;
  maritalAllowance?: number;
  seniorityAllowance?: number;
  responsibilityAllowance?: number;
  specialAllowance?: number;
  educationDegree?: string;
  notes?: string;
}

export class UpdateContractDto {
  contractType?: string;
  decreeType?: string;
  decreeTitle?: string;
  startDate?: string;
  endDate?: string;
  issueDate?: string;
  baseDailySalary?: number;
  baseMonthlySalary?: number;
  housingAllowance?: number;
  groceryAllowance?: number;
  childAllowancePerChild?: number;
  maritalAllowance?: number;
  seniorityAllowance?: number;
  responsibilityAllowance?: number;
  specialAllowance?: number;
  educationDegree?: string;
  notes?: string;
  isActive?: boolean;
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

export class BatchCalculateSlipsDto {
  periodId: string;
  defaultWorkingDays?: number;
}

export class CreatePayrollPeriodDto {
  year: number;
  month: number;
  title?: string;
}
