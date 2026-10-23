import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export default registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET ?? 'supersecretjwtkey_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ??
      'supersecretrefreshkey_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  }),
);
