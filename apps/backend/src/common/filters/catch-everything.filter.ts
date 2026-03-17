import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Inject,
	Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import type { Prisma } from "@prisma/generated/client.js";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import { EnvironmentsEnum } from "../enums/environments.enum.js";
import type {
	ErrorResponseBody,
	HttpExceptionResponse,
} from "../types/error-response.type.js";

const PRISMA_ERROR_MAP: Record<string, HttpStatus> = {
	P2000: HttpStatus.BAD_REQUEST,
	P2001: HttpStatus.NOT_FOUND,
	P2002: HttpStatus.CONFLICT,
	P2003: HttpStatus.BAD_REQUEST,
	P2014: HttpStatus.BAD_REQUEST,
	P2025: HttpStatus.NOT_FOUND,
} as const;

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const INTERNAL_ERROR_TYPE = "InternalServerErrorException";

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
	private readonly logger = new Logger(CatchEverythingFilter.name);

	constructor(
		@Inject(HttpAdapterHost) private readonly httpAdapterHost: HttpAdapterHost,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		const { httpAdapter } = this.httpAdapterHost;
		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		const { statusCode, error, message } = this.normalizeException(exception);

		const responseBody: ErrorResponseBody = {
			error,
			message,
			path: httpAdapter.getRequestUrl(request),
			statusCode,
			timestamp: new Date().toISOString(),
		};

		if (statusCode >= 500) {
			this.logger.error(
				`Unhandled ${statusCode} error: ${String(exception)}`,
				exception instanceof Error ? exception.stack : undefined,
			);
		}

		httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
	}

	private normalizeException(exception: unknown): {
		statusCode: number;
		error: string;
		message: string | string[];
	} {
		if (exception instanceof HttpException) {
			return this.normalizeHttpException(exception);
		}

		if (this.isPrismaKnownRequestError(exception)) {
			return this.normalizePrismaKnownRequestError(exception);
		}

		if (this.isPrismaValidationError(exception)) {
			return this.normalizePrismaValidationError(exception);
		}

		return this.normalizeUnknownError(exception);
	}

	private normalizeHttpException(exception: HttpException): {
		statusCode: number;
		error: string;
		message: string | string[];
	} {
		const statusCode = exception.getStatus();
		const response = exception.getResponse() as HttpExceptionResponse;

		if (typeof response === "string") {
			return {
				error: exception.name,
				message: response,
				statusCode,
			};
		}

		const message = response?.message ?? exception.message;
		const error = response?.error ?? exception.name;

		return {
			error: typeof error === "string" ? error : "Error",
			message: Array.isArray(message)
				? message
				: String(message ?? INTERNAL_ERROR_MESSAGE),
			statusCode: response?.statusCode ?? statusCode,
		};
	}

	private normalizePrismaKnownRequestError(
		error: Prisma.PrismaClientKnownRequestError,
	): {
		statusCode: number;
		error: string;
		message: string | string[];
	} {
		const statusCode =
			PRISMA_ERROR_MAP[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
		const message = this.getPrismaErrorMessage(error);

		return {
			error: "PrismaClientKnownRequestError",
			message,
			statusCode,
		};
	}

	private normalizePrismaValidationError(
		error: Prisma.PrismaClientValidationError,
	): {
		statusCode: number;
		error: string;
		message: string | string[];
	} {
		const isProduction = this.isProduction();
		const message = isProduction ? "Validation failed" : error.message;

		return {
			error: "PrismaClientValidationError",
			message,
			statusCode: HttpStatus.BAD_REQUEST,
		};
	}

	private normalizeUnknownError(exception: unknown): {
		statusCode: number;
		error: string;
		message: string | string[];
	} {
		const isProduction = this.isProduction();

		return {
			error: INTERNAL_ERROR_TYPE,
			message: isProduction
				? INTERNAL_ERROR_MESSAGE
				: exception instanceof Error
					? exception.message
					: String(exception),
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
		};
	}

	private getPrismaErrorMessage(
		error: Prisma.PrismaClientKnownRequestError,
	): string {
		if (error.code === "P2002") {
			const target = (error.meta?.target as string[] | undefined)?.[0];
			return target
				? `Unique constraint failed on field: ${target}`
				: error.message;
		}
		if (error.code === "P2025") {
			const modelName = error.meta?.modelName;
			return modelName
				? `${String(modelName)} record not found`
				: "Record not found";
		}
		return error.message;
	}

	private isProduction(): boolean {
		return (
			this.configService.get<string>(`${ConfigKeyEnum.ENVIRONMENT}.nodeEnv`) ===
			EnvironmentsEnum.PRODUCTION
		);
	}

	private isPrismaKnownRequestError(
		exception: unknown,
	): exception is Prisma.PrismaClientKnownRequestError {
		return (
			typeof exception === "object" &&
			exception !== null &&
			"code" in exception &&
			typeof (exception as Prisma.PrismaClientKnownRequestError).code ===
				"string" &&
			(exception as Prisma.PrismaClientKnownRequestError).code.startsWith("P")
		);
	}

	private isPrismaValidationError(
		exception: unknown,
	): exception is Prisma.PrismaClientValidationError {
		return (
			exception instanceof Error &&
			exception.constructor.name === "PrismaClientValidationError"
		);
	}
}
