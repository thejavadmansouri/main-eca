import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDriverDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty({ message: 'نام راننده الزامی است' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'شماره تماس الزامی است' })
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsNotEmpty({ message: 'شماره پلاک خودرو الزامی است' })
  @IsString()
  plateNumber: string;

  @IsNotEmpty({ message: 'نوع خودرو الزامی است' })
  @IsString()
  vehicleType: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
