export class CreateProductionOrderDto {
  code?: string;
  bomId!: string;
  productId!: string;
  targetQuantity!: number;
  priority?: number;
  startDate?: string;
  dueDate?: string;
  warehouseId?: string;
  targetWarehouseId?: string;
  companyId?: string;
  branchId?: string;
  notes?: string;
}

export class MaterialIssueItemInput {
  materialId!: string;
  quantity!: number;
  locationId?: string;
  unitCost?: number;
}

export class IssueMaterialsDto {
  issues!: MaterialIssueItemInput[];
}

export class UpdateOperationProgressDto {
  status!: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  actualMinutes?: number;
  operatorName?: string;
}

export class RecordQualityCheckDto {
  inspectorName!: string;
  passed!: boolean;
  checklist?: Record<string, boolean>;
  defects?: string;
}

export class CompleteOrderDto {
  completedQuantity!: number;
  scrapQuantity?: number;
  targetLocationId?: string;
  laborCost?: number;
  overheadCost?: number;
}
