export class CreateTreasuryAccountDto {
  name: string;
  type: string; // BANK, CASH_DESK, PETTY_CASH
  accountNumber?: string;
  iban?: string;
  bankName?: string;
  branchName?: string;
  balance?: number;
  posTerminalId?: string;
  notes?: string;
}

export class UpdateTreasuryAccountDto {
  name?: string;
  accountNumber?: string;
  iban?: string;
  bankName?: string;
  branchName?: string;
  balance?: number;
  posTerminalId?: string;
  isActive?: boolean;
  notes?: string;
}

export class RegisterChequeDto {
  number: string;
  sayadId?: string;
  chequeType?: string; // RECEIVABLE, PAYABLE
  amount: number;
  bankName: string;
  branch?: string;
  holderName?: string;
  drawerNationalId?: string;
  dueDate: string;
  note?: string;
}

export class DepositChequeDto {
  targetAccountId: string;
  depositDate?: string;
}

export class ClearChequeDto {
  targetAccountId?: string;
  clearDate?: string;
}

export class BounceChequeDto {
  bounceReason: string;
  bouncedDate?: string;
}

export class EndorseChequeDto {
  endorsedTo: string;
  endorsedDate?: string;
  note?: string;
}

export class TransferFundsDto {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  trackingCode?: string;
  description: string;
}
