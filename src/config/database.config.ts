import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url: process.env.DATABASE_URL ?? '',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'dev',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'nest_template',
  }),
);
