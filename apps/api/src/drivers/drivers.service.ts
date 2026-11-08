import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, activeOnly = false) {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { plateNumber: { contains: q } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });
    if (!driver) throw new NotFoundException('راننده مورد نظر یافت نشد.');
    return driver;
  }

  async create(dto: CreateDriverDto) {
    let code = dto.code;
    if (!code) {
      const count = await this.prisma.driver.count();
      code = `DRV-${100 + count + 1}`;
    }

    const existing = await this.prisma.driver.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`کد راننده ${code} قبلاً ثبت شده است.`);
    }

    return this.prisma.driver.create({
      data: {
        code,
        fullName: dto.fullName,
        mobile: dto.mobile,
        nationalId: dto.nationalId,
        licenseNumber: dto.licenseNumber,
        plateNumber: dto.plateNumber,
        vehicleType: dto.vehicleType,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findById(id);
    return this.prisma.driver.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.driver.delete({
      where: { id },
    });
  }
}
