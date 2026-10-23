
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module.js';
import { users } from '../../database/schema/user.schema.js';
import { roles } from '../../database/schema/role.schema.js';
import type { Database } from '../../database/database.types.js';
import { count, eq } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { createPaginationMeta } from '../../common/utils/pagination.util.js';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import type { IUsersService } from './users.service.interface.js';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) { }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, offset } = query;

    const [data, totalResult] = await Promise.all([
      this.db.select({
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
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(users),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);
    const meta = createPaginationMeta(page, limit, totalItems);

    return apiResponse(data, 'Users retrieved successfully', meta);
  }

  async findById(id: string) {
    const result = await this.db.select({
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
      .where(eq(users.id, id));
    return result[0];
  }

  async create(data: CreateUserDto) {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: UpdateUserDto) {
    const result = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async delete(id: string) {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result[0];
  }
}
