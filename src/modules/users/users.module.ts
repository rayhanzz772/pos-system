import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { DatabaseModule } from '../../database/database.module.js';
import { USERS_SERVICE } from './users.service.interface.js';
import { SecurityModule } from '../../security/security.module.js';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USERS_SERVICE,
      useClass: UsersService,
    },
  ],
})
export class UsersModule { }
