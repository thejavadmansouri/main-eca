export class CreateWorkstationDto {
  code!: string;
  name!: string;
  hourlyRate?: number;
  capacityMinutesPerDay?: number;
  location?: string;
}
