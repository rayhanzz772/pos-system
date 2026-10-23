import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email!: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
