import type { ApiResponse } from '../../common/dto/api-response.dto.js';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import type { CreatePurchaseDto } from './dto/create-purchase.dto.js';

export const PURCHASES_SERVICE = 'PURCHASES_SERVICE';

export interface IPurchasesService {
  createPurchase(
    dto: CreatePurchaseDto,
    authenticatedUserId?: string,
  ): Promise<ApiResponse<any>>;
  getPurchases(query: PaginationQueryDto): Promise<ApiResponse<any>>;
  getPurchaseById(id: string): Promise<ApiResponse<any>>;
}
