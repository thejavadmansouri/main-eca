export class CreateRepairOrderDto {
  customerId: string;
  technicianId?: string;
  deviceType: string;
  brandAndModel: string;
  serialNumber?: string;
  accessories?: string;
  customerProblem: string;
  isUnderWarranty?: boolean;
  warrantyExpireDate?: string;
  estimatedReadyAt?: string;
  depositPaid?: number;
  laborCost?: number;
  notes?: string;
}

export class AddRepairItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  hasOldPart?: boolean;
}

export class UpdateStatusDto {
  status: string;
  technicalReport?: string;
  laborCost?: number;
  notes?: string;
}

export class SettleRepairDto {
  depositPaid?: number;
  discountAmount?: number;
  notes?: string;
}
