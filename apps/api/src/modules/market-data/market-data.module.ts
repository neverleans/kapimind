/**
 * MarketDataModule - brapi client + worker de sincronização.
 */

import { Module } from '@nestjs/common';
import { BrapiService } from '@/lib/brapi.service';
import { BrapiSyncWorker } from '@/workers/brapi-sync.worker';

@Module({
  providers: [BrapiService, BrapiSyncWorker],
  exports: [BrapiService, BrapiSyncWorker],
})
export class MarketDataModule {}
