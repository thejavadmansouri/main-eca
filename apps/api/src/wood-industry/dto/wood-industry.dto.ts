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
