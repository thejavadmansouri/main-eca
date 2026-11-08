import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { CustomFieldsService } from './custom-fields.service';

@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private service: CustomFieldsService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.SALES)
  @Get('schema/:entityType')
  getSchema(@Param('entityType') entityType: string) {
    return this.service.getSchema(entityType);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('schema')
  createField(@Body() dto: any) {
    return this.service.createField(dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('schema/:id')
  updateField(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateField(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.SALES)
  @Get('values/:entityId')
  getValues(@Param('entityId') entityId: string) {
    return this.service.getValues(entityId);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.SALES)
  @Post('values/:entityId')
  setValues(@Param('entityId') entityId: string, @Body() body: any) {
    return this.service.setValues(entityId, body.values || body);
  }
}
