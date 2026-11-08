export class AddCuttingItemDto {
  productionOrderId: string;
  partName: string;
  materialType: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm?: number;
  quantity?: number;
  grainDirection?: string;
  edgeL1?: string;
  edgeL2?: string;
  edgeW1?: string;
  edgeW2?: string;
  notes?: string;
}

export class AddProfileGlassDto {
  productionOrderId: string;
  itemType: string; // PROFILE, GLASS, INFILL
  title: string;
  dimensions: string;
  quantity?: number;
  unit?: string;
  supplierName?: string;
  notes?: string;
}

export class ProcessScanDto {
  barcode: string;
  stationCode: string; // SAW, EDGE, CNC, ASSM, PACK
  operatorName: string;
}

export class CreateInstallationDto {
  productionOrderId?: string;
  customerId?: string;
  projectAddress: string;
  customerName: string;
  contactPhone: string;
  driverName?: string;
  installerLead?: string;
  scheduledDate: string;
}

export class UpdateInstallationStatusDto {
  status: string; // SCHEDULED, LOADED, IN_TRANSIT, INSTALLING, COMPLETED, CANCELLED
  completionNotes?: string;
  customerSignature?: boolean;
}

export class CreateWoodOrderDto {
  code?: string;
  customerType?: string; // B2B | B2C
  customerName?: string;
  endClientName?: string;
  projectTitle?: string;
  assignedInstaller?: string;
  installerPhone?: string;
  productId?: string;
  targetQuantity?: number;
  priority?: number;
  dueDate?: string;
  notes?: string;
}

export class AdvanceStageDto {
  stage: string;
  operatorName: string;
  notes?: string;
}

export class CreateInboundReceiptDto {
  supplierName: string;
  driverName?: string;
  truckPlate?: string;
  waybillNumber?: string;
  warehouseId: string;
  itemCount?: number;
  notes?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit?: string;
    thicknessMm?: number;
    dimensions?: string;
  }>;
}

export class VerifyInboundReceiptDto {
  verifiedBy: string;
  status: 'VERIFIED' | 'REJECTED';
  notes?: string;
}

export class CreateProjectMilestoneDto {
  stepNumber: number;
  title: string;
  percentage: number;
  amount: number;
  dueStage?: string;
  dueDate?: string;
  notes?: string;
}

export class CreateProjectContractDto {
  productionOrderId: string;
  totalAmount: number;
  discount?: number;
  tax?: number;
  terms?: string;
  warrantyMonths?: number;
  milestones?: CreateProjectMilestoneDto[];
}

export class RecordProjectPaymentDto {
  contractId: string;
  milestoneId?: string;
  amount: number;
  method?: string; // CASH, CARD_READER, TRANSFER, CHEQUE
  trackingCode?: string;
  chequeNumber?: string;
  chequeDueDate?: string;
  chequeBank?: string;
  verifiedBy?: string;
  notes?: string;
}

export class CreateStageUpdateDto {
  stationCode: string;
  title: string;
  notes?: string;
  photos?: string[];
  operatorName?: string;
  advanceStage?: boolean;
}


