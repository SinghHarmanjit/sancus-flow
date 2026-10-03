import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../db/drizzle.service';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    const result = {
      status: 'ok',
      db: 'unknown',
      llm: 'unknown',
    };

    // Check DB connectivity
    try {
      await this.drizzle.db.execute(sql`SELECT 1`);
      result.db = 'connected';
    } catch (err) {
      this.logger.error('DB health check failed', err);
      result.db = 'error';
      result.status = 'degraded';
    }

    // Check LLM reachability
    try {
      let baseUrl = this.config.get<string>('LLM_BASE_URL', 'http://localhost:10086');
      if (baseUrl.includes('localhost') && !baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
      }
      const response = await fetch(`${baseUrl}/models`, { signal: AbortSignal.timeout(3000) });
      result.llm = response.ok ? 'reachable' : 'error';
    } catch (err) {
      this.logger.warn('LLM health check failed', err);
      result.llm = 'unreachable';
    }

    return result;
  }
}
