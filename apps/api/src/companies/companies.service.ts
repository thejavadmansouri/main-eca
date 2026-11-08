import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      include: {
        branches: true,
        fiscalYears: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        fiscalYears: true,
      },
    });
  }

  create(dto: {
    code: string;
    name: string;
    legalName?: string;
    nationalId?: string;
    economicCode?: string;
    registrationNo?: string;
    phone?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    currency?: string;
  }) {
    return this.prisma.company.create({
      data: {
        code: dto.code,
        name: dto.name,
        legalName: dto.legalName,
        nationalId: dto.nationalId,
        economicCode: dto.economicCode,
        registrationNo: dto.registrationNo,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        postalCode: dto.postalCode,
        currency: dto.currency || 'TOMAN',
      },
    });
  }

  update(
    id: string,
    dto: Partial<{
      name: string;
      legalName: string;
      nationalId: string;
      economicCode: string;
      registrationNo: string;
      phone: string;
      email: string;
      address: string;
      postalCode: string;
      currency: string;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  createBranch(
    companyId: string,
    dto: { code: string; name: string; phone?: string; address?: string },
  ) {
    return this.prisma.branch.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
      },
    });
  }

  createFiscalYear(
    companyId: string,
    dto: { title: string; startDate: string; endDate: string },
  ) {
    return this.prisma.fiscalYear.create({
      data: {
        companyId,
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }
}
