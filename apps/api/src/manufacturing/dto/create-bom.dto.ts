export class BomItemInput {
  materialId!: string;
  quantity!: number;
  unit?: string;
  scrapPercentage?: number;
  note?: string;
}

export class BomOperationInput {
  workstationId!: string;
  step!: number;
  title!: string;
  durationMinutes?: number;
  instructions?: string;
}

export class CreateBomDto {
  code!: string;
  name!: string;
  productId!: string;
  quantity?: number;
  unit?: string;
  routingNote?: string;
  estimatedLaborCost?: number;
  estimatedOverheadCost?: number;
  items!: BomItemInput[];
  operations?: BomOperationInput[];
}
