import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.types.js';
import { users } from '../../database/schema/user.schema.js';
import { roles } from '../../database/schema/role.schema.js';
import { PasswordService } from '../../security/password.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import type { IAuthService } from './auth.service.interface.js';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const result = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        role: {
          id: roles.id,
          name: roles.name,
          code: roles.code,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.email, dto.email), isNull(users.deletedAt)));

    const user = result[0];
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.verify(
      user.password,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.code ?? 'USER',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: (this.configService.get<string>('jwt.expiresIn') ?? '1d') as any,
    });

    return apiResponse(
      {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.code ?? 'USER',
        },
      },
      'Login successful',
    );
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email));

    if (existingUser.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const roleCode = (dto.roleCode ?? 'USER').toUpperCase();
    const roleResult = await this.db
      .select()
      .from(roles)
      .where(eq(roles.code, roleCode));

    const role = roleResult[0];
    if (!role) {
      throw new BadRequestException(`Role "${roleCode}" not found`);
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const [newUser] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        roleId: role.id,
      })
      .returning();

    return apiResponse(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role.code,
      },
      'User registered successfully',
    );
  }

  async getProfile(userId: string) {
    const result = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        role: {
          id: roles.id,
          name: roles.name,
          code: roles.code,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    const user = result[0];
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return apiResponse(user, 'Profile retrieved successfully');
  }
}
