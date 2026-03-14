import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EndpointsService } from '../endpoints/endpoints.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;

  const mockPrisma = {
    requestLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const mockEndpoints = {
    findBySlug: jest.fn().mockResolvedValue(null),
  };
  const mockNotifications = {
    evaluateAndNotify: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EndpointsService, useValue: mockEndpoints },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(ProxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('maskSensitiveHeaders', () => {
    it('should redact Authorization header', () => {
      const headers = { Authorization: 'Bearer secret123', 'Content-Type': 'application/json' };
      const result = service.maskSensitiveHeaders(headers);
      expect(result.Authorization).toBe('[REDACTED]');
      expect(result['Content-Type']).toBe('application/json');
    });

    it('should redact Cookie and x-api-key', () => {
      const headers = {
        Cookie: 'session=abc',
        'X-Api-Key': 'key123',
        Accept: 'application/json',
      };
      const result = service.maskSensitiveHeaders(headers);
      expect(result.Cookie).toBe('[REDACTED]');
      expect(result['X-Api-Key']).toBe('[REDACTED]');
      expect(result.Accept).toBe('application/json');
    });
  });

  describe('truncateForLog', () => {
    it('should return null for null input', () => {
      expect(service.truncateForLog(null, 100)).toBeNull();
    });

    it('should truncate long strings', () => {
      const long = 'a'.repeat(150);
      const result = service.truncateForLog(long, 100);
      expect(result?.length).toBeLessThanOrEqual(120);
      expect(result).toContain('...[truncated]');
    });

    it('should not truncate short strings', () => {
      const short = 'hello';
      expect(service.truncateForLog(short, 100)).toBe('hello');
    });
  });

  describe('buildTargetUrl', () => {
    it('should combine base URL with path and query', () => {
      const endpoint = {
        id: '1',
        targetUrl: 'https://api.example.com',
        slug: 'abc',
        name: 'Test',
        userId: 'u1',
        isActive: true,
        createdAt: new Date(),
      };
      expect(service.buildTargetUrl(endpoint, '/v1/users', 'page=1')).toBe(
        'https://api.example.com/v1/users?page=1',
      );
    });
  });
});
