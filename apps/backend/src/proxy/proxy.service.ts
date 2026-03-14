import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Endpoint } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EndpointsService } from '../endpoints/endpoints.service';

@Injectable()
export class ProxyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly endpointsService: EndpointsService,
    private readonly notifications: NotificationsService,
  ) {}

  async resolveEndpoint(slug: string): Promise<Endpoint | null> {
    return this.endpointsService.findBySlug(slug);
  }

  async logRequest(data: {
    endpointId: string;
    method: string;
    path: string;
    queryParams: string | null;
    requestHeaders: Record<string, string> | null;
    requestBody: string | null;
    responseStatus: number | null;
    responseHeaders: Record<string, string> | null;
    responseBody: string | null;
    durationMs: number;
    clientIp: string | null;
  }) {
    const payload = {
      endpointId: data.endpointId,
      method: data.method,
      path: data.path,
      queryParams: data.queryParams,
      requestHeaders: data.requestHeaders ?? Prisma.JsonNull,
      requestBody: data.requestBody,
      responseStatus: data.responseStatus,
      responseHeaders: data.responseHeaders ?? Prisma.JsonNull,
      responseBody: data.responseBody,
      durationMs: data.durationMs,
      clientIp: data.clientIp,
    };
    this.prisma.requestLog
      .create({ data: payload })
      .catch((err) => console.error('Failed to log request:', err));

    this.notifications
      .evaluateAndNotify(data.endpointId, {
        responseStatus: data.responseStatus,
        durationMs: data.durationMs,
        method: data.method,
        path: data.path,
      })
      .catch((err) => console.error('Notification evaluation failed:', err));
  }

  truncateForLog(value: string | Buffer | null, limit: number): string | null {
    if (value == null) return null;
    const str = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
    if (str.length <= limit) return str;
    return str.slice(0, limit) + '\n...[truncated]';
  }

  buildTargetUrl(
    endpoint: Endpoint,
    path: string,
    queryString: string,
  ): string {
    const base = endpoint.targetUrl.replace(/\/$/, '');
    const pathPart = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}${pathPart}`;
    return queryString ? `${url}?${queryString}` : url;
  }

  maskSensitiveHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const mask = '[REDACTED]';
    const sensitive = new Set([
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'proxy-authorization',
    ]);
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      result[key] = sensitive.has(key.toLowerCase()) ? mask : value;
    }
    return result;
  }

  getClientIp(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return first?.split(',')[0]?.trim() ?? null;
    }
    return null;
  }

  cleanHeadersForUpstream(
    headers: Record<string, string | string[] | undefined>,
    targetHost: string,
  ): Record<string, string> {
    const skip = new Set([
      'host',
      'connection',
      'content-length',
      'transfer-encoding',
    ]);
    const result: Record<string, string> = { Host: targetHost };
    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (skip.has(lower)) continue;
      if (value === undefined) continue;
      const v = Array.isArray(value) ? value.join(', ') : value;
      result[key] = v;
    }
    return result;
  }
}
