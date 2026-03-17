import { Body, Controller, Inject, Post } from "@nestjs/common";
import { type AuthResponse, AuthService } from "./auth.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	@Post("register")
	async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
		return this.authService.register(dto);
	}

	@Post("login")
	async login(@Body() dto: LoginDto): Promise<AuthResponse> {
		return this.authService.login(dto);
	}
}
