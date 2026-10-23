import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { DRIZZLE } from '../../database/database.module.js';
import { PasswordService } from '../../security/password.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: {},
        },
        {
          provide: PasswordService,
          useValue: {
            hash: vi.fn(),
            verify: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
