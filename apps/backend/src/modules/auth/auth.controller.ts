import type { Request, Response } from "express";
import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import type { AuthResponseType } from "./types/auth-response.type";
import type { RequestWithRefreshAuth } from "./types/request-with-refresh-auth.type";
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
import { ErrorResponseSchema } from "../../common/swagger/schemas/error-response.schema";
import { EnvironmentType } from "../../core/config/types/environment.type";
import { JwtType } from "../../core/config/types/jwt.type";
import { AuthService } from "./auth.service";
import { authThrottle } from "./auth-throttle.constants";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { parseDurationToMs } from "./utils/duration.util";

const REFRESH_COOKIE_NAME = "refresh_token";

@ApiTags("Auth")
@ApiExtraModels(AuthResponseSchema)
@Controller("auth")
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
		return parseDurationToMs(this.refreshExpiresIn);
	}

	private setRefreshCookie(res: Response, rawRefresh: string): void {
		res.cookie(REFRESH_COOKIE_NAME, rawRefresh, {
			httpOnly: true,
			secure: this.isProduction,
			sameSite: "lax",
			path: "/",
			maxAge: this.refreshCookieMaxAgeMs(),
		});
	}

	private clearRefreshCookie(res: Response): void {
		res.clearCookie(REFRESH_COOKIE_NAME, {
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
			limit: authThrottle.SIGN_UP.limit,
			ttl: authThrottle.SIGN_UP.ttlMs,
		},
	})
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up")
	@ApiBody({ type: SignUpDto })
	@ApiOperation({
		summary: "Register a new user",
		description:
			"Sends a verification code to email. Use verify-email to complete registration.",
		security: [],
	})
	@ApiCreatedResponse({ description: "User created; check email for code" })
	@ApiConflictResponse({
		description: "Conflict - Resource already exists or state conflict",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
		return this.authService.signUp(signUpDto);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottle.VERIFY_EMAIL.limit,
			ttl: authThrottle.VERIFY_EMAIL.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post("verify-email")
	@ApiBody({ type: VerifyEmailDto })
	@ApiOperation({ summary: "Verify email with 6-digit code", security: [] })
	@ApiOkResponse({
		description: "Verified; tokens issued",
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: "Invalid or expired code",
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
			limit: authThrottle.RESEND_VERIFICATION.limit,
			ttl: authThrottle.RESEND_VERIFICATION.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post("resend-verification")
	@ApiBody({ type: ResendVerificationDto })
	@ApiOperation({ summary: "Resend verification code", security: [] })
	@ApiOkResponse({ description: "Generic success message" })
	async resendVerification(
		@Body() dto: ResendVerificationDto,
	): Promise<{ message: string }> {
		return this.authService.resendVerification(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottle.SIGN_IN.limit,
			ttl: authThrottle.SIGN_IN.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post("sign-in")
	@ApiBody({ type: SignInDto })
	@ApiOperation({
		summary: "Authenticate user",
		description:
			"Requires verified email. Refresh token is set as httpOnly cookie.",
		security: [],
	})
	@ApiOkResponse({
		description: "Successfully authenticated",
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: "Unauthorized - Missing or invalid authentication",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiForbiddenResponse({
		description: "Email not verified",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
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
			limit: authThrottle.FORGOT_PASSWORD.limit,
			ttl: authThrottle.FORGOT_PASSWORD.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post("forgot-password")
	@ApiBody({ type: ForgotPasswordDto })
	@ApiOperation({ summary: "Request password reset code", security: [] })
	@ApiOkResponse({ description: "Generic message (no email enumeration)" })
	async forgotPassword(
		@Body() dto: ForgotPasswordDto,
	): Promise<{ message: string }> {
		return this.authService.forgotPassword(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: authThrottle.RESET_PASSWORD.limit,
			ttl: authThrottle.RESET_PASSWORD.ttlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post("reset-password")
	@ApiBody({ type: ResetPasswordDto })
	@ApiOperation({ summary: "Reset password with code", security: [] })
	@ApiOkResponse({ description: "Password reset" })
	@ApiUnauthorizedResponse({
		description: "Invalid or expired code",
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
	@Post("refresh")
	@ApiOperation({
		summary: "Refresh access token",
		description: "Uses httpOnly refresh cookie; rotates refresh token.",
		security: [],
	})
	@ApiOkResponse({
		description: "New access token",
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: "Invalid session",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async refresh(
		@Req() req: Request & RequestWithRefreshAuth,
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
	@Post("logout")
	@ApiOperation({ summary: "Revoke refresh session", security: [] })
	@ApiOkResponse({ description: "Logged out" })
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ success: boolean }> {
		const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
		await this.authService.logout(raw);
		this.clearRefreshCookie(res);
		return { success: true };
	}

	@Get("me")
	@ApiOperation({ summary: "Current user", security: [] })
	@ApiOkResponse({ description: "Current user profile" })
	@ApiUnauthorizedResponse({
		description: "Unauthorized",
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	async me(
		@CurrentUser() user: CurrentUserPayload,
	): Promise<CurrentUserPayload> {
		return this.authService.getMe(user.id);
	}
}
