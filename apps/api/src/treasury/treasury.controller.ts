import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import {
  BounceChequeDto,
  ClearChequeDto,
  CreateTreasuryAccountDto,
  DepositChequeDto,
  EndorseChequeDto,
  RegisterChequeDto,
  TransferFundsDto,
  UpdateTreasuryAccountDto,
} from './dto/treasury.dto';
import { TreasuryService } from './treasury.service';

@Controller('treasury')
@Roles(Role.ADMIN, Role.MANAGER)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  // ───────────────────────── حساب‌های خزانه‌داری ─────────────────────────
  @Get('accounts')
  async getAccounts() {
    return this.treasuryService.getAccounts();
  }

  @Get('accounts/:id')
  async getAccountById(@Param('id') id: string) {
    return this.treasuryService.getAccountById(id);
  }

  @Post('accounts')
  async createAccount(@Body() dto: CreateTreasuryAccountDto) {
    return this.treasuryService.createAccount(dto);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateTreasuryAccountDto,
  ) {
    return this.treasuryService.updateAccount(id, dto);
  }

  // ───────────────────────── کارتابل چک‌های صیادی ─────────────────────────
  @Get('cheques')
  async getCheques(
    @Query('status') status?: string,
    @Query('chequeType') chequeType?: string,
    @Query('q') q?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('isOverdue') isOverdue?: string,
  ) {
    return this.treasuryService.getCheques({
      status,
      chequeType,
      q,
      fromDate,
      toDate,
      isOverdue: isOverdue === 'true',
    });
  }

  @Get('cheques/analytics')
  async getChequeAnalytics() {
    return this.treasuryService.getChequeAnalytics();
  }

  @Post('cheques')
  async registerCheque(@Body() dto: RegisterChequeDto) {
    return this.treasuryService.registerCheque(dto);
  }

  @Post('cheques/:id/deposit')
  async depositCheque(
    @Param('id') id: string,
    @Body() dto: DepositChequeDto,
  ) {
    return this.treasuryService.depositCheque(id, dto);
  }

  @Post('cheques/:id/clear')
  async clearCheque(
    @Param('id') id: string,
    @Body() dto: ClearChequeDto,
  ) {
    return this.treasuryService.clearCheque(id, dto);
  }

  @Post('cheques/:id/bounce')
  async bounceCheque(
    @Param('id') id: string,
    @Body() dto: BounceChequeDto,
  ) {
    return this.treasuryService.bounceCheque(id, dto);
  }

  @Post('cheques/:id/endorse')
  async endorseCheque(
    @Param('id') id: string,
    @Body() dto: EndorseChequeDto,
  ) {
    return this.treasuryService.endorseCheque(id, dto);
  }

  @Post('cheques/:id/return')
  async returnCheque(@Param('id') id: string) {
    return this.treasuryService.returnCheque(id);
  }

  // ───────────────────────── انتقال وجوه و تراکنش‌ها ─────────────────────────
  @Post('transfers')
  async transferFunds(@Body() dto: TransferFundsDto) {
    return this.treasuryService.transferFunds(dto);
  }

  @Get('transactions')
  async getTransactions(@Query('limit') limit?: string) {
    return this.treasuryService.getTransactions(
      limit ? parseInt(limit, 10) : 30,
    );
  }
}
