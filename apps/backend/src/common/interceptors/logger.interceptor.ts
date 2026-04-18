import type { Request, Response } from "express";
import type { EnvironmentType } from "../../core/config/types/environment.type.js";
import {
	type CallHandler,
	type ExecutionContext,
	HttpException,
	Inject,
	Injectable,
	Logger,
	type NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Observable, tap } from "rxjs";
import { httpConstants } from "../constants/http.constants.js";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import { EnvironmentsEnum } from "../enums/environments.enum.js";

type LoggerExpressionType = "incoming" | "error" | "success";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);
	private readonly isProduction: boolean;

	constructor(@Inject(ConfigService) readonly configService: ConfigService) {
		const { nodeEnv } = configService.getOrThrow<EnvironmentType>(
			ConfigKeyEnum.ENVIRONMENT,
		);

		this.isProduction = nodeEnv === EnvironmentsEnum.PRODUCTION;
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (this.isProduction) return next.handle();
		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest<Request>();
		const response = httpContext.getResponse<Response>();
		const { method, originalUrl } = request;
		const start = Date.now();
		this.logResponse("incoming", request, method, originalUrl);
		return next.handle().pipe(
			tap({
				error: (e) => {
					const duration = Date.now() - start;
					const statusCode =
						e instanceof HttpException
							? e.getStatus()
							: response.statusCode || httpConstants.INTERNAL_SERVER_ERROR;
					this.logResponse(
						"error",
						request,
						method,
						originalUrl,
						statusCode,
						duration,
						e,
					);
				},
				next: () => {
					const duration = Date.now() - start;
					const { statusCode } = response;
					this.logResponse(
						"success",
						request,
						method,
						originalUrl,
						statusCode,
						duration,
					);
				},
			}),
		);
	}

	private logResponse(
		loggerExpressionType: LoggerExpressionType,
		request: Request,
		method: string,
		url: string,
		statusCode?: number,
		duration?: number,
		error?: unknown,
	): void {
		const base = {
			kind: "http_request",
			phase: loggerExpressionType,
			method,
			url,
			correlationId: request.correlationId ?? null,
			statusCode: statusCode ?? null,
			durationMs: duration ?? null,
			error:
				loggerExpressionType === "error"
					? error instanceof Error
						? error.message
						: String(error)
					: null,
		};
		const line = JSON.stringify(base);
		switch (loggerExpressionType) {
			case "incoming":
				this.logger.debug(line);
				break;
			case "success":
				this.logger.debug(line);
				break;
			case "error":
				this.logger.error(line);
				break;
		}
	}
}
