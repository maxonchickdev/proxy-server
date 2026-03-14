import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import { ProxyService } from './proxy.service';

const BODY_LIMIT = 1024 * 1024; // 1MB for forwarding

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  constructor(private readonly proxyService: ProxyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { slug, path, isProxy } = this.extractSlugAndPath(req);
    if (!isProxy || !slug) {
      return next();
    }

    const endpoint = await this.proxyService.resolveEndpoint(slug);
    if (!endpoint) {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `No proxy endpoint found for slug: ${slug}`,
      });
      return;
    }

    const startTime = Date.now();
    let requestBody: Buffer | null = null;

    try {
      requestBody = await this.bufferBody(req, BODY_LIMIT);
    } catch {
      res.status(413).json({ error: 'Request entity too large' });
      return;
    }

    const queryString = req.url.includes('?')
      ? req.url.slice(req.url.indexOf('?') + 1)
      : '';
    const targetUrl = this.proxyService.buildTargetUrl(
      endpoint,
      path,
      queryString,
    );

    const targetHost = new URL(endpoint.targetUrl).host;
    const headers = this.proxyService.cleanHeadersForUpstream(
      req.headers as Record<string, string | string[] | undefined>,
      targetHost,
    );

    const axiosConfig: import('axios').AxiosRequestConfig = {
      method: req.method,
      url: targetUrl,
      headers,
      data: requestBody?.length ? requestBody : undefined,
      maxBodyLength: BODY_LIMIT,
      maxContentLength: BODY_LIMIT,
      validateStatus: () => true,
      timeout: 30000,
    };

    try {
      const response = await axios(axiosConfig);
      const durationMs = Date.now() - startTime;

      res.status(response.status);
      for (const [key, value] of Object.entries(response.headers)) {
        const skip = ['transfer-encoding', 'content-encoding', 'connection'];
        if (skip.includes(key.toLowerCase())) continue;
        if (typeof value === 'string') res.setHeader(key, value);
      }
      res.send(response.data);

      this.proxyService.logRequest({
        endpointId: endpoint.id,
        method: req.method,
        path,
        queryParams: queryString || null,
        requestHeaders: this.proxyService.maskSensitiveHeaders(
          headers as Record<string, string>,
        ),
        requestBody: this.proxyService.truncateForLog(
          requestBody,
          100 * 1024,
        ),
        responseStatus: response.status,
        responseHeaders: this.proxyService.maskSensitiveHeaders(
          response.headers as Record<string, string>,
        ),
        responseBody: this.proxyService.truncateForLog(
          response.data,
          100 * 1024,
        ),
        durationMs,
        clientIp: this.proxyService.getClientIp(
          req.headers as Record<string, string | string[] | undefined>,
        ),
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const status = axios.isAxiosError(err) && err.response
        ? err.response.status
        : 502;
      const body = axios.isAxiosError(err) && err.response
        ? err.response.data
        : { error: 'Bad Gateway', message: 'Could not reach target' };

      res.status(status).json(body);

      this.proxyService.logRequest({
        endpointId: endpoint.id,
        method: req.method,
        path,
        queryParams: queryString || null,
        requestHeaders: this.proxyService.maskSensitiveHeaders(
          headers as Record<string, string>,
        ),
        requestBody: this.proxyService.truncateForLog(
          requestBody,
          100 * 1024,
        ),
        responseStatus: status,
        responseHeaders: null,
        responseBody: null,
        durationMs,
        clientIp: this.proxyService.getClientIp(
          req.headers as Record<string, string | string[] | undefined>,
        ),
      });
    }
  }

  private extractSlugAndPath(req: Request): {
    slug: string | null;
    path: string;
    isProxy: boolean;
  } {
    const host = req.headers.host ?? '';
    const path = (req.originalUrl ?? req.url ?? req.path ?? '').split('?')[0];
    const pathMatch = path.match(/^\/r\/([a-z0-9]+)(\/.*)?$/i);

    if (pathMatch) {
      return {
        slug: pathMatch[1],
        path: pathMatch[2] ?? '/',
        isProxy: true,
      };
    }

    const baseDomain = process.env.PROXY_BASE_DOMAIN ?? 'lvh.me';
    const parts = host.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      const rest = parts.slice(1).join('.');
      if (
        rest === baseDomain ||
        rest.endsWith(`.${baseDomain}`)
      ) {
        const skip = ['www', 'api', 'app', 'dashboard'];
        if (!skip.includes(subdomain.toLowerCase())) {
          return {
            slug: subdomain,
            path: path || '/',
            isProxy: true,
          };
        }
      }
    }

    return { slug: null, path, isProxy: false };
  }

  private bufferBody(req: Request, limit: number): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) {
          req.destroy();
          reject(new Error('Body too large'));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () =>
        resolve(chunks.length ? Buffer.concat(chunks) : null),
      );
      req.on('error', reject);
    });
  }
}
