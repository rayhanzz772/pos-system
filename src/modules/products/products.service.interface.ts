import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export interface IProductsService {
  findAll(query: PaginationQueryDto): Promise<unknown>;
  findById(id: string): Promise<unknown>;
  create(data: CreateProductDto): Promise<unknown>;
  update(id: string, data: UpdateProductDto): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';
