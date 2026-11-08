import { Global, Module } from '@nestjs/common';

import { PostingService } from './posting.service';
import { ReconciliationService } from './reconciliation.service';
import { TrialBalanceService } from './trial-balance.service';
import { VouchersController } from './vouchers.controller';

/**
 * ماژول سند خودکار — Global تا هر سرویسِ مالی (فروش، دریافت، مرجوعی، خرید)
 * بدون importِ اضافه بتواند PostingService را تزریق کند.
 */
@Global()
@Module({
  controllers: [VouchersController],
  providers: [PostingService, ReconciliationService, TrialBalanceService],
  exports: [PostingService, ReconciliationService, TrialBalanceService],
})
export class VouchersModule {}
