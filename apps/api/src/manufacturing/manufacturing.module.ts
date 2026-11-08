import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InventoryOperationModule } from '../inventory-operation/inventory-operation.module';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';

@Module({
  imports: [PrismaModule, InventoryOperationModule],
  controllers: [ManufacturingController],
  providers: [ManufacturingService],
  exports: [ManufacturingService],
})
export class ManufacturingModule {}
