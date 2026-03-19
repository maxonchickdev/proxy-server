import { Body, Controller, Inject, Post } from "@nestjs/common";
import {
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiExtraModels,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiTooManyRequestsResponse,
	ApiUnauthorizedResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthResponseSchema } from "src/common/swagger/schemas/auth-response.schema";
import type { AuthResponseType } from "./types/auth-response.type";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

@ApiTags("Auth")
@ApiExtraModels(AuthResponseSchema)
@Controller("auth")
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	@Post("sign-up")
	@ApiBody({ type: SignUpDto })
	@ApiOperation({
		summary: "Register a new user",
		description: "Creates a new user account and returns an access token.",
		security: [],
	})
	@ApiCreatedResponse({
		description: "User successfully registered",
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiConflictResponse({
		description: "Conflict - Resource already exists or state conflict",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseType> {
		return this.authService.signUp(signUpDto);
	}

	@Post("sign-in")
	@ApiBody({ type: SignInDto })
	@ApiOperation({
		summary: "Authenticate user",
		description: "Returns an access token for valid credentials.",
		security: [],
	})
	@ApiOkResponse({
		description: "Successfully authenticated",
		schema: { $ref: getSchemaPath(AuthResponseSchema) },
	})
	@ApiUnauthorizedResponse({
		description: "Unauthorized - Missing or invalid authentication",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseType> {
		return this.authService.signIn(signInDto);
	}
}
