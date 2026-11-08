import { Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import * as schema from './schema';

export const DB = Symbol('DB');
export type Database = NodePgDatabase<typeof schema>;
const POOL = Symbol('POOL');

@Injectable()
class PoolCloser implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}
  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    { provide: POOL, inject: [ENV], useFactory: (env: Env) => new Pool({ connectionString: env.databaseUrl }) },
    { provide: DB, inject: [POOL], useFactory: (pool: Pool): Database => drizzle(pool, { schema }) },
    PoolCloser,
  ],
  exports: [DB],
})
export class DbModule {}
