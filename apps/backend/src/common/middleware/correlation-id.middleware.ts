import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const HEADER = "x-correlation-id";

/** Ensures each request has a correlation id for structured logs and tracing. */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction): void {
		const incoming = req.headers[HEADER];
		const id =
			typeof incoming === "string" && incoming.length > 0
				? incoming
				: randomUUID();
		req.correlationId = id;
		res.setHeader("X-Correlation-ID", id);
		next();
	}
}
