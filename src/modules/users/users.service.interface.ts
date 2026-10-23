import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export interface IUsersService {
  findAll(query: PaginationQueryDto): Promise<unknown>;
  findById(id: string): Promise<unknown>;
  create(data: CreateUserDto): Promise<unknown>;
  update(id: string, data: UpdateUserDto): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}

export const USERS_SERVICE = 'USERS_SERVICE';
