import { Module, Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreateHoldingSchema, CreateTransactionSchema, UpdatePortfolioSchema } from '@/lib/zod.schemas';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  // ===== Portfolio =====

  @Get(':id')
  async getPortfolio(@Param('id') id: string) {
    return this.service.getPortfolio(id);
  }

  @Put(':id')
  async updatePortfolio(@Param('id') id: string, @Body() body: unknown) {
    const data = UpdatePortfolioSchema.parse(body);
    return this.service.updatePortfolio(id, data);
  }

  // ===== Holdings =====

  @Get(':id/holdings')
  async listHoldings(@Param('id') id: string) {
    return this.service.listHoldings(id);
  }

  @Post(':id/holdings')
  async addHolding(@Param('id') id: string, @Body() body: unknown) {
    const data = CreateHoldingSchema.parse(body);
    return this.service.addHolding(id, data);
  }

  @Delete(':id/holdings/:ticker')
  async removeHolding(@Param('id') id: string, @Param('ticker') ticker: string) {
    return this.service.removeHolding(id, ticker);
  }

  // ===== Transactions =====

  @Get(':id/transactions')
  async listTransactions(
    @Param('id') id: string,
    @Query('ticker') ticker?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listTransactions(id, { ticker, from, to });
  }

  @Post(':id/transactions')
  async addTransaction(@Param('id') id: string, @Body() body: unknown) {
    const data = CreateTransactionSchema.parse(body);
    return this.service.addTransaction(id, data);
  }

  // ===== Reports =====

  @Get(':id/summary')
  async getSummary(@Param('id') id: string) {
    return this.service.getSummary(id);
  }
}

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
