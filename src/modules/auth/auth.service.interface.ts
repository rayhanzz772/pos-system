import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface AuthUserPayload {
  sub: string;
  email: string;
  role?: string;
}

export interface IAuthService {
  login(dto: LoginDto): Promise<any>;
  register(dto: RegisterDto): Promise<any>;
  getProfile(userId: string): Promise<any>;
}
