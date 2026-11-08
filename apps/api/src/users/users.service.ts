import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            personnelCode: true,
            jobTitle: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: {
    username: string;
    password: string;
    fullName: string;
    role?: Role;
    canManageSite?: boolean;
    permissions?: string[];
    isActive?: boolean;
    employeeId?: string;
  }) {
    const hash = await argon2.hash(dto.password);
    const role = dto.role ?? Role.STAFF;

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hash,
        fullName: dto.fullName,
        role,
        canManageSite:
          dto.canManageSite ?? (role === Role.ADMIN || role === Role.MANAGER),
        permissions: dto.permissions ?? [],
        isActive: dto.isActive ?? true,
      },

      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
      },
    });

    if (dto.employeeId) {
      await this.prisma.employee.update({
        where: { id: dto.employeeId },
        data: { userId: user.id },
      });
    }

    return user;
  }

  async getMyProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        permissions: true,
        isActive: true,
        canManageSite: true,
        createdAt: true,
        employee: {
          include: {
            department: true,
            contracts: {
              orderBy: { startDate: 'desc' },
              take: 5,
            },
            payrollSlips: {
              include: {
                period: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 12,
            },
          },
        },
        workTasksAssigned: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
          include: {
            items: true,
            requestedBy: {
              select: { id: true, fullName: true, username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        notificationsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async changeRole(id: string, role: Role) {
    // ارتقا به مدیر، دسترسیِ سایت را خودکار روشن می‌کند؛ برعکسِ آن (تنزل)
    // پرچم را دست نمی‌زند تا یک انتخابِ صریحِ مدیر از بین نرود.
    const canManageSite = (
      await this.prisma.user.findUnique({
        where: { id },
        select: { canManageSite: true },
      })
    )?.canManageSite;

    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        role,
        canManageSite:
          canManageSite || role === Role.ADMIN || role === Role.MANAGER,
      },

      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
      },
    });
  }

  async setSiteAccess(id: string, canManageSite: boolean) {
    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        canManageSite,
      },

      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
      },
    });
  }

  async updatePermissions(id: string, permissions: string[]) {
    return this.prisma.user.update({
      where: { id },
      data: { permissions },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
      },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        canManageSite: true,
        permissions: true,
        isActive: true,
      },
    });
  }

  async changePassword(id: string, password: string) {
    const hash = await argon2.hash(password);

    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        password: hash,
      },

      select: {
        id: true,
        username: true,
        fullName: true,
      },
    });
  }
}
