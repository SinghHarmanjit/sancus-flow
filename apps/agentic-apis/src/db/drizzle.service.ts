import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';
import * as path from 'path';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  db!: NodePgDatabase<typeof schema>;
  private pool!: Pool;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.pool = new Pool({ connectionString: url });
    this.db = drizzle(this.pool, { schema });

    const migrationsFolder = path.join(process.cwd(), 'src/db/migrations');
    await migrate(this.db, { migrationsFolder });
    this.logger.log('Migrations applied successfully');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
