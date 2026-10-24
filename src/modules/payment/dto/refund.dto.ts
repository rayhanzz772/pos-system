import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class RefundDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
