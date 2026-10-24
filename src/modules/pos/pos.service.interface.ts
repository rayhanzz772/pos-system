import { CheckoutDto } from './dto/checkout.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export const POS_SERVICE = 'POS_SERVICE';

export interface IPosService {
  checkout(dto: CheckoutDto, authenticatedUserId?: string): Promise<any>;
  getOrderHistory(query: PaginationQueryDto): Promise<any>;
  getOrderById(id: string): Promise<any>;
}
