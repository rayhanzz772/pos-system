import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module.js';
import { SecurityModule } from '../../security/security.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AUTH_SERVICE } from './auth.service.interface.js';
import { AuthGuard } from './guards/auth.guard.js';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
    AuthGuard,
  ],
  exports: [AUTH_SERVICE, AuthGuard, JwtModule],
})
export class AuthModule {}
