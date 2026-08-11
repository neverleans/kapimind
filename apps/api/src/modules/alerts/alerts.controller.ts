/**
 * TradingView webhook controller.
 *
 * Recebe POST com JSON do alert() Pine Script.
 * Autentica via HMAC SHA256 (header `TradingView-Signature: sha256=<hex>`).
 * Enfileira em alerts.raw para processamento IA.
 */

import { Controller, Post, Body, Headers, HttpCode, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AlertsService } from './alerts.service';

interface TradingViewPayload {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  strategy: string;
  interval: string;
  timestamp?: string;
  userId?: string;
}

@Controller('webhook')
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(
    private readonly alerts: AlertsService,
    private readonly config: ConfigService,
  ) {}

  @Post('tv')
  @HttpCode(202)
  async tradingview(
    @Body() body: TradingViewPayload,
    @Headers('tradingview-signature') signature: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing TradingView-Signature header');
    }

    // Validate payload
    if (!body.ticker || !body.price || !body.action) {
      throw new BadRequestException('Missing required fields: ticker, price, action');
    }

    // HMAC verification
    const secret = this.config.get<string>('TV_WEBHOOK_SECRET') ?? '';
    const rawBody = JSON.stringify(body);
    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    if (!this.safeCompare(provided, expected.replace(/^sha256=/, ''))) {
      this.logger.warn(`HMAC mismatch for ${body.ticker}`);
      throw new UnauthorizedException('Invalid signature');
    }

    return this.alerts.receiveAlert(body);
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}
