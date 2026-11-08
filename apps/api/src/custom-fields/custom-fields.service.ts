import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomFieldType } from '@prisma/client';

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  getSchema(entityType: string) {
    return this.prisma.customField.findMany({
      where: { entityType },
      orderBy: { order: 'asc' },
    });
  }

  createField(dto: {
    entityType: string;
    name: string;
    label: string;
    type?: CustomFieldType;
    options?: string[];
    isRequired?: boolean;
    order?: number;
  }) {
    return this.prisma.customField.create({
      data: {
        entityType: dto.entityType,
        name: dto.name,
        label: dto.label,
        type: dto.type || CustomFieldType.TEXT,
        options: dto.options || [],
        isRequired: dto.isRequired || false,
        order: dto.order || 0,
      },
    });
  }

  updateField(
    id: string,
    dto: Partial<{
      label: string;
      options: string[];
      isRequired: boolean;
      order: number;
    }>,
  ) {
    return this.prisma.customField.update({
      where: { id },
      data: dto,
    });
  }

  async getValues(entityId: string) {
    const rows = await this.prisma.customFieldValue.findMany({
      where: { entityId },
      include: { customField: true },
    });

    const result: Record<string, any> = {};
    for (const r of rows) {
      result[r.customField.name] = r.value;
    }
    return result;
  }

  async setValues(entityId: string, values: Record<string, any>) {
    const updates: Promise<any>[] = [];

    for (const [fieldName, val] of Object.entries(values)) {
      const field = await this.prisma.customField.findFirst({
        where: { name: fieldName },
      });

      if (!field) continue;

      const stringVal = val === null || val === undefined ? '' : String(val);

      updates.push(
        this.prisma.customFieldValue.upsert({
          where: {
            customFieldId_entityId: {
              customFieldId: field.id,
              entityId,
            },
          },
          create: {
            customFieldId: field.id,
            entityId,
            value: stringVal,
          },
          update: {
            value: stringVal,
          },
        }),
      );
    }

    return Promise.all(updates);
  }
}
