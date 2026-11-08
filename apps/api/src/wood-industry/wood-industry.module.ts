import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WoodIndustryController } from './wood-industry.controller';
import { WoodIndustryService } from './wood-industry.service';

@Module({
  imports: [PrismaModule],
  controllers: [WoodIndustryController],
  providers: [WoodIndustryService],
  exports: [WoodIndustryService],
})
export class WoodIndustryModule {}
