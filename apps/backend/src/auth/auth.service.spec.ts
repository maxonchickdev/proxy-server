import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'test@example.com',
          name: 'Test',
          passwordHash: 'hashed',
        }),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token on valid login', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });
      expect(result.accessToken).toBe('token');
    });
  });
});
