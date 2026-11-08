import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import {
  CreateWebhookDto,
  SaveIntegrationDto,
  TriggerWebhookTestDto,
} from './dto/integrations.dto';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@Roles(Role.ADMIN, Role.MANAGER)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ───────────────────────── اتصالات خارجی ─────────────────────────
  @Get()
  async getIntegrations() {
    return this.integrationsService.getIntegrations();
  }

  @Post()
  async saveIntegration(@Body() dto: SaveIntegrationDto) {
    return this.integrationsService.saveIntegration(dto);
  }

  @Post(':id/sync')
  async syncWooCommerce(@Param('id') id: string) {
    return this.integrationsService.syncWooCommerce(id);
  }

  // ───────────────────────── وب‌هوک‌ها ─────────────────────────
  @Get('webhooks')
  async getWebhooks() {
    return this.integrationsService.getWebhooks();
  }

  @Post('webhooks')
  async createWebhook(@Body() dto: CreateWebhookDto) {
    return this.integrationsService.createWebhook(dto);
  }

  @Get('webhooks/logs')
  async getWebhookLogs(@Query('endpointId') endpointId?: string) {
    return this.integrationsService.getWebhookLogs(endpointId);
  }

  @Post('webhooks/test')
  async triggerWebhookTest(@Body() dto: TriggerWebhookTestDto) {
    return this.integrationsService.triggerWebhookTest(dto);
  }

  // ───────────────────────── داشبورد هوش تجاری (BI) ─────────────────────────
  @Get('bi/metrics')
  async getBiExecutiveMetrics() {
    return this.integrationsService.getBiExecutiveMetrics();
  }
}
