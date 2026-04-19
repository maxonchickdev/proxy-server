import type { Request, Response } from "express";
import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import type { EnvironmentType } from "../../core/config/types/environment.type";
import type { JwtType } from "../../core/config/types/jwt.type";
import type { AuthResponseType } from "./types/auth-response.type";
import type { RequestWithRefreshAuthType } from "./types/request-with-refresh-auth.type";
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiExtraModels,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiTooManyRequestsResponse,
	ApiUnauthorizedResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { EnvironmentsEnum } from "../../common/enums/environments.enum";
import { AuthResponseSchema } from "../../common/swagger/schemas/auth-response.schema";
import { AuthUserSchema } from "../../common/swagger/schemas/auth-user.schema";
import { ErrorResponseSchema } from "../../common/swagger/schemas/error-response.schema";
import { LogoutResponseSchema } from "../../common/swagger/schemas/logout-response.schema";
import { MessageResponseSchema } from "../../common/swagger/schemas/message-response.schema";
import { AuthService } from "./auth.service";
import { authThrottleConst } from "./consts/auth-throttle.const";
import { refreshCookieName } from "./consts/refresh-cookie.const";
import { swaggerConst } from "./consts/swagger.const";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { parseDurationToMsUtil } from "./utils/duration.util";

@ApiTags(swaggerConst.tag)
@ApiExtraModels(
	AuthResponseSchema,
	AuthUserSchema,
	ErrorResponseSchema,
	LogoutResponseSchema,
	MessageResponseSchema,
)
@Controller(swaggerConst.route)
export class AuthController {
	private readonly isProduction: boolean;
	private readonly refreshExpiresIn: string;

	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) readonly configService: ConfigService,
	) {
		const { nodeEnv } = configService.getOrThrow<EnvironmentType>(
			ConfigKeyEnum.ENVIRONMENT,
		);
		this.isProduction = nodeEnv === EnvironmentsEnum.PRODUCTION;

		const { refreshExpiresIn } = configService.getOrThrow<JwtType>(
			ConfigKeyEnum.JWT,
		);

		this.refreshExpiresIn = refreshExpiresIn;
	}

	private refreshCookieMaxAgeMs(): number {
		return parseDurationToMsUtil(this.refreshExpiresIn);
	}

	private setRefreshCookie(res: Response, rawRefresh: string): void {
		res.cookie(refreshCookieName, rawRefresh, {
			httpOnly: true,
			secure: this.isProduction,
			sameSite: "lax",
			path: "/",
			maxAge: this.refreshCookieMaxAgeMs(),
		});
	}

	private clearRefreshCookie(res: Response): void {
		res.clearCookie(refreshCookieName, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: this.isProduction,
		});
	}

	private bodyAuth(
		res: Response,
		result: AuthResponseType & { refreshToken: string },
	): AuthResponseType {
		this.setRefreshCookie(res, result.refreshToken);
		return {
			accessToken: result.accessToken,
			user: result.user,
		};
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.signUp.limit,
			ttl: authThrottleConst.signUp.ttlMs,
		},
	})
	@HttpCode(HttpStatus.CREATED)
	@Post(swaggerConst.routes.signUp.route)
	@ApiBody({ type: SignUpDto })
	@ApiOperation({
		summary: swaggerConst.routes.signUp.operation.summary,
		description: swaggerConst.routes.signUp.operation.descr,
		security: [],
	})
	@ApiCreatedResponse({
		description: swaggerConst.routes.signUp.responses.created,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.signUp.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiConflictResponse({
		description: swaggerConst.routes.signUp.responses.conflict,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: swaggerConst.routes.signUp.responses.tooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: swaggerConst.routes.signUp.responses.internalServerError,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
		return this.authService.signUp(signUpDto);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.verifyEmail.limit,
			ttl: authThrottleConst.verifyEmail.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.verifyEmail.route)
	@ApiBody({ type: VerifyEmailDto })
	@ApiOperation({
		summary: swaggerConst.routes.verifyEmail.operation.summary,
		description: swaggerConst.routes.verifyEmail.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.verifyEmail.responses.ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.verifyEmail.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.verifyEmail.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async verifyEmail(
		@Body() dto: VerifyEmailDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseType> {
		const result = await this.authService.verifyEmail(dto.email, dto.code);
		return this.bodyAuth(res, result);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.resendVerification.limit,
			ttl: authThrottleConst.resendVerification.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.resendVerification.route)
	@ApiBody({ type: ResendVerificationDto })
	@ApiOperation({
		summary: swaggerConst.routes.resendVerification.operation.summary,
		description: swaggerConst.routes.resendVerification.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.resendVerification.responses.ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.resendVerification.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description:
			swaggerConst.routes.resendVerification.responses.tooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async resendVerification(
		@Body() dto: ResendVerificationDto,
	): Promise<{ message: string }> {
		return this.authService.resendVerification(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.signIn.limit,
			ttl: authThrottleConst.signIn.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.signIn.route)
	@ApiBody({ type: SignInDto })
	@ApiOperation({
		summary: swaggerConst.routes.signIn.operation.summary,
		description: swaggerConst.routes.signIn.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.signIn.responses.ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.signIn.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.signIn.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiForbiddenResponse({
		description: swaggerConst.routes.signIn.responses.forbidden,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: swaggerConst.routes.signIn.responses.tooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: swaggerConst.routes.signIn.responses.internalServerError,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async signIn(
		@Body() signInDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseType> {
		const result = await this.authService.signIn(signInDto);
		return this.bodyAuth(res, result);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.forgotPassword.limit,
			ttl: authThrottleConst.forgotPassword.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.forgotPassword.route)
	@ApiBody({ type: ForgotPasswordDto })
	@ApiOperation({
		summary: swaggerConst.routes.forgotPassword.operation.summary,
		description: swaggerConst.routes.forgotPassword.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.forgotPassword.responses.ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.forgotPassword.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: swaggerConst.routes.forgotPassword.responses.tooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async forgotPassword(
		@Body() dto: ForgotPasswordDto,
	): Promise<{ message: string }> {
		return this.authService.forgotPassword(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottleConst.resetPassword.limit,
			ttl: authThrottleConst.resetPassword.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.resetPassword.route)
	@ApiBody({ type: ResetPasswordDto })
	@ApiOperation({
		summary: swaggerConst.routes.resetPassword.operation.summary,
		description: swaggerConst.routes.resetPassword.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.resetPassword.responses.ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: swaggerConst.routes.resetPassword.responses.badRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.resetPassword.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: swaggerConst.routes.resetPassword.responses.tooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async resetPassword(
		@Body() dto: ResetPasswordDto,
	): Promise<{ message: string }> {
		return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
	}

	@Public()
	@UseGuards(RefreshAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.refresh.route)
	@ApiOperation({
		summary: swaggerConst.routes.refresh.operation.summary,
		description: swaggerConst.routes.refresh.operation.descr,
		security: [],
	})
	@ApiOkResponse({
		description: swaggerConst.routes.refresh.responses.ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.refresh.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async refresh(
		@Req() req: Request & RequestWithRefreshAuthType,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseType> {
		const raw = req.refreshAuth?.rawRefreshToken;
		if (!raw) {
			throw new UnauthorizedException("Invalid session");
		}
		const result = await this.authService.rotateRefreshToken(raw);
		return this.bodyAuth(res, result);
	}

	@HttpCode(HttpStatus.OK)
	@Post(swaggerConst.routes.logout.route)
	@ApiBearerAuth("Bearer")
	@ApiOperation({
		summary: swaggerConst.routes.logout.operation.summary,
		description: swaggerConst.routes.logout.operation.descr,
	})
	@ApiOkResponse({
		description: swaggerConst.routes.logout.responses.ok,
		schema: { $ref: getSchemaPath(LogoutResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.logout.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ success: boolean }> {
		const raw = req.cookies?.[refreshCookieName] as string | undefined;
		await this.authService.logout(raw);
		this.clearRefreshCookie(res);
		return { success: true };
	}

	@Get(swaggerConst.routes.me.route)
	@ApiBearerAuth("Bearer")
	@ApiOperation({
		summary: swaggerConst.routes.me.operation.summary,
		description: swaggerConst.routes.me.operation.descr,
	})
	@ApiOkResponse({
		description: swaggerConst.routes.me.responses.ok,
		schema: { $ref: getSchemaPath(AuthUserSchema) },
	})
	@ApiUnauthorizedResponse({
		description: swaggerConst.routes.me.responses.unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	me(@CurrentUser() user: CurrentUserPayload): Promise<CurrentUserPayload> {
		return this.authService.getMe(user.id);
	}
}
