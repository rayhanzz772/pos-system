
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export const DRIZZLE = 'DRIZZLE';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString =
          config.get<string>('database.url') ||
          config.getOrThrow<string>('DATABASE_URL');

        const pool = new Pool({ connectionString });

        return drizzle({ client: pool, schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule { }
