
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from './database/database.module.js';

@Injectable()
export class AppService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: any,
  ) { }

  async getHealth() {
    const result = await this.db.execute(
      sql`SELECT current_database() AS database, NOW() AS time`,
    );

    return {
      message: 'Database connected successfully',
      result: result.rows,
    };
  }
}
