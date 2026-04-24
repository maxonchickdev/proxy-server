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
import { ConfigKey } from "../../common/constants/config-key.constant";
import { Environments } from "../../common/constants/environments.constant";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthResponseSchema } from "../../common/swagger/schemas/auth-response.schema";
import { AuthUserSchema } from "../../common/swagger/schemas/auth-user.schema";
import { ErrorResponseSchema } from "../../common/swagger/schemas/error-response.schema";
import { LogoutResponseSchema } from "../../common/swagger/schemas/logout-response.schema";
import { MessageResponseSchema } from "../../common/swagger/schemas/message-response.schema";
import { AuthService } from "./auth.service";
import { AuthThrottle } from "./constsants/auth-throttle.constant";
import { RefreshCookieName } from "./constsants/refresh-cookie.constant";
import { Swagger } from "./constsants/swagger.constant";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { ResendVerificationDto } from "./dtos/resend-verification.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { SignInDto } from "./dtos/sign-in.dto";
import { SignUpDto } from "./dtos/sign-up.dto";
import { VerifyEmailDto } from "./dtos/verify-email.dto";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { parseDurationToMsUtil } from "./utils/duration.util";

@ApiTags(Swagger.Tag)
@ApiExtraModels(
	AuthResponseSchema,
	AuthUserSchema,
	ErrorResponseSchema,
	LogoutResponseSchema,
	MessageResponseSchema,
)
@Controller(Swagger.Route)
export class AuthController {
	private readonly isProduction: boolean;
	private readonly refreshExpiresIn: string;

	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) readonly configService: ConfigService,
	) {
		const { nodeEnv } = configService.getOrThrow<EnvironmentType>(
			ConfigKey.Environment,
		);
		this.isProduction = nodeEnv === Environments.Production;

		const { refreshExpiresIn } = configService.getOrThrow<JwtType>(
			ConfigKey.Jwt,
		);

		this.refreshExpiresIn = refreshExpiresIn;
	}

	private refreshCookieMaxAgeMs(): number {
		return parseDurationToMsUtil(this.refreshExpiresIn);
	}

	private setRefreshCookie(res: Response, rawRefresh: string): void {
		res.cookie(RefreshCookieName, rawRefresh, {
			httpOnly: true,
			secure: this.isProduction,
			sameSite: "lax",
			path: "/",
			maxAge: this.refreshCookieMaxAgeMs(),
		});
	}

	private clearRefreshCookie(res: Response): void {
		res.clearCookie(RefreshCookieName, {
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
			limit: AuthThrottle.SignUp.Limit,
			ttl: AuthThrottle.SignUp.TtlMs,
		},
	})
	@HttpCode(HttpStatus.CREATED)
	@Post(Swagger.Routes.SignUp.Route)
	@ApiBody({ type: SignUpDto })
	@ApiOperation({
		summary: Swagger.Routes.SignUp.Operation.Summary,
		description: Swagger.Routes.SignUp.Operation.Descr,
		security: [],
	})
	@ApiCreatedResponse({
		description: Swagger.Routes.SignUp.Responses.Created,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.SignUp.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiConflictResponse({
		description: Swagger.Routes.SignUp.Responses.Conflict,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: Swagger.Routes.SignUp.Responses.TooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: Swagger.Routes.SignUp.Responses.InternalServerError,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
		return this.authService.signUp(signUpDto);
	}

	@Public()
	@Throttle({
		default: {
			limit: AuthThrottle.VerifyEmail.Limit,
			ttl: AuthThrottle.VerifyEmail.TtlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.VerifyEmail.Route)
	@ApiBody({ type: VerifyEmailDto })
	@ApiOperation({
		summary: Swagger.Routes.VerifyEmail.Operation.Summary,
		description: Swagger.Routes.VerifyEmail.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.VerifyEmail.Responses.Ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.VerifyEmail.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.VerifyEmail.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public async verifyEmail(
		@Body() dto: VerifyEmailDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseType> {
		const result = await this.authService.verifyEmail(dto.email, dto.code);
		return this.bodyAuth(res, result);
	}

	@Public()
	@Throttle({
		default: {
			limit: AuthThrottle.ResendVerification.Limit,
			ttl: AuthThrottle.ResendVerification.TtlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.ResendVerification.Route)
	@ApiBody({ type: ResendVerificationDto })
	@ApiOperation({
		summary: Swagger.Routes.ResendVerification.Operation.Summary,
		description: Swagger.Routes.ResendVerification.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.ResendVerification.Responses.Ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.ResendVerification.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: Swagger.Routes.ResendVerification.Responses.TooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public resendVerification(
		@Body() dto: ResendVerificationDto,
	): Promise<{ message: string }> {
		return this.authService.resendVerification(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: AuthThrottle.SignIn.Limit,
			ttl: AuthThrottle.SignIn.TtlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.SignIn.Route)
	@ApiBody({ type: SignInDto })
	@ApiOperation({
		summary: Swagger.Routes.SignIn.Operation.Summary,
		description: Swagger.Routes.SignIn.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.SignIn.Responses.Ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.SignIn.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.SignIn.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiForbiddenResponse({
		description: Swagger.Routes.SignIn.Responses.Forbidden,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: Swagger.Routes.SignIn.Responses.TooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiInternalServerErrorResponse({
		description: Swagger.Routes.SignIn.Responses.InternalServerError,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public async signIn(
		@Body() signInDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseType> {
		const result = await this.authService.signIn(signInDto);
		return this.bodyAuth(res, result);
	}

	@Public()
	@Throttle({
		default: {
			limit: AuthThrottle.ForgotPassword.Limit,
			ttl: AuthThrottle.ForgotPassword.TtlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.ForgotPassword.Route)
	@ApiBody({ type: ForgotPasswordDto })
	@ApiOperation({
		summary: Swagger.Routes.ForgotPassword.Operation.Summary,
		description: Swagger.Routes.ForgotPassword.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.ForgotPassword.Responses.Ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.ForgotPassword.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: Swagger.Routes.ForgotPassword.Responses.TooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public forgotPassword(
		@Body() dto: ForgotPasswordDto,
	): Promise<{ message: string }> {
		return this.authService.forgotPassword(dto.email);
	}

	@Public()
	@Throttle({
		default: {
			limit: AuthThrottle.ResetPassword.Limit,
			ttl: AuthThrottle.ResetPassword.TtlMs,
		},
	})
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.ResetPassword.Route)
	@ApiBody({ type: ResetPasswordDto })
	@ApiOperation({
		summary: Swagger.Routes.ResetPassword.Operation.Summary,
		description: Swagger.Routes.ResetPassword.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.ResetPassword.Responses.Ok,
		schema: { $ref: getSchemaPath(MessageResponseSchema) },
	})
	@ApiBadRequestResponse({
		description: Swagger.Routes.ResetPassword.Responses.BadRequest,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.ResetPassword.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	@ApiTooManyRequestsResponse({
		description: Swagger.Routes.ResetPassword.Responses.TooManyRequests,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public resetPassword(
		@Body() dto: ResetPasswordDto,
	): Promise<{ message: string }> {
		return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
	}

	@Public()
	@UseGuards(RefreshAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post(Swagger.Routes.Refresh.Route)
	@ApiOperation({
		summary: Swagger.Routes.Refresh.Operation.Summary,
		description: Swagger.Routes.Refresh.Operation.Descr,
		security: [],
	})
	@ApiOkResponse({
		description: Swagger.Routes.Refresh.Responses.Ok,
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.Refresh.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public async refresh(
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
	@Post(Swagger.Routes.Logout.Route)
	@ApiBearerAuth("Bearer")
	@ApiOperation({
		summary: Swagger.Routes.Logout.Operation.Summary,
		description: Swagger.Routes.Logout.Operation.Descr,
	})
	@ApiOkResponse({
		description: Swagger.Routes.Logout.Responses.Ok,
		schema: { $ref: getSchemaPath(LogoutResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.Logout.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ success: boolean }> {
		const raw = req.cookies?.[RefreshCookieName] as string | undefined;
		await this.authService.logout(raw);
		this.clearRefreshCookie(res);
		return { success: true };
	}

	@Get(Swagger.Routes.Me.Route)
	@ApiBearerAuth("Bearer")
	@ApiOperation({
		summary: Swagger.Routes.Me.Operation.Summary,
		description: Swagger.Routes.Me.Operation.Descr,
	})
	@ApiOkResponse({
		description: Swagger.Routes.Me.Responses.Ok,
		schema: { $ref: getSchemaPath(AuthUserSchema) },
	})
	@ApiUnauthorizedResponse({
		description: Swagger.Routes.Me.Responses.Unauthorized,
		schema: { $ref: getSchemaPath(ErrorResponseSchema) },
	})
	public me(
		@CurrentUser() user: CurrentUserPayload,
	): Promise<CurrentUserPayload> {
		return this.authService.me(user.id);
	}
}
