import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import type { SignInDto } from "./dto/sign-in.dto";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { AuthResponseType } from "./types/auth-response.type";
import { randomInt } from "node:crypto";
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { authVerificationConstants } from "./auth-verification.constants";
import { PasswordResetService } from "./password-reset.service";
import { TokenService } from "./token.service";

const CODE_TTL_MS = 15 * 60 * 1000;
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(EmailService) private readonly email: EmailService,
		@Inject(TokenService) private readonly tokenService: TokenService,
		@Inject(PasswordResetService)
		private readonly passwordResetService: PasswordResetService,
	) {}

	private generateSixDigitCode(): string {
		return String(
			randomInt(
				authVerificationConstants.SIX_DIGIT_CODE_MIN_INCLUSIVE,
				authVerificationConstants.SIX_DIGIT_CODE_MAX_EXCLUSIVE,
			),
		);
	}

	async signUp(signUpDto: SignUpDto): Promise<{ message: string }> {
		const emailLower = signUpDto.email.toLowerCase();
		const existing = await this.prisma.user.findUnique({
			where: { email: emailLower },
		});
		if (existing) {
			throw new ConflictException("User with this email already exists");
		}
		const passwordHash = await bcrypt.hash(signUpDto.password, SALT_ROUNDS);
		const plainCode = this.generateSixDigitCode();
		const verificationCodeHash = await bcrypt.hash(plainCode, SALT_ROUNDS);
		const verificationExpiresAt = new Date(Date.now() + CODE_TTL_MS);
		await this.prisma.user.create({
			data: {
				email: emailLower,
				passwordHash,
				name: signUpDto.name ?? null,
				isEmailVerified: false,
				verificationCodeHash,
				verificationExpiresAt,
			},
		});
		await this.email.sendVerificationCode(emailLower, plainCode).catch((e) => {
			this.logger.error(`Failed to send verification email: ${e}`);
		});
		return {
			message:
				"Registration successful. Check your email for a verification code.",
		};
	}

	async verifyEmail(
		email: string,
		code: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const emailLower = email.toLowerCase();
		const user = await this.prisma.user.findUnique({
			where: { email: emailLower },
		});
		if (!user) {
			throw new UnauthorizedException("Invalid email or code");
		}
		if (user.isEmailVerified) {
			throw new BadRequestException("Email is already verified");
		}
		if (
			!user.verificationCodeHash ||
			!user.verificationExpiresAt ||
			user.verificationExpiresAt < new Date()
		) {
			throw new UnauthorizedException("Invalid or expired verification code");
		}
		const ok = await bcrypt.compare(code, user.verificationCodeHash);
		if (!ok) {
			throw new UnauthorizedException("Invalid or expired verification code");
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				isEmailVerified: true,
				verificationCodeHash: null,
				verificationExpiresAt: null,
			},
		});
		return this.tokenService.issueTokensForUserId(user.id);
	}

	async resendVerification(email: string): Promise<{ message: string }> {
		const emailLower = email.toLowerCase();
		const user = await this.prisma.user.findUnique({
			where: { email: emailLower },
		});
		if (!user) {
			return { message: "If an account exists, a code was sent." };
		}
		if (user.isEmailVerified) {
			throw new BadRequestException("Email is already verified");
		}
		const plainCode = this.generateSixDigitCode();
		const verificationCodeHash = await bcrypt.hash(plainCode, SALT_ROUNDS);
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				verificationCodeHash,
				verificationExpiresAt: new Date(Date.now() + CODE_TTL_MS),
			},
		});
		await this.email.sendVerificationCode(emailLower, plainCode).catch((e) => {
			this.logger.error(`Failed to send verification email: ${e}`);
		});
		return { message: "If an account exists, a code was sent." };
	}

	async signIn(
		signInDto: SignInDto,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const user = await this.prisma.user.findUnique({
			where: { email: signInDto.email.toLowerCase() },
		});
		if (!user) {
			throw new UnauthorizedException("Invalid email or password");
		}
		const valid = await bcrypt.compare(signInDto.password, user.passwordHash);
		if (!valid) {
			throw new UnauthorizedException("Invalid email or password");
		}
		if (!user.isEmailVerified) {
			throw new ForbiddenException(
				"Please verify your email before signing in.",
			);
		}
		return this.tokenService.issueTokensForUserId(user.id);
	}

	async validateUserById(
		userId: string,
	): Promise<{ id: string; email: string; name: string | null } | null> {
		return this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true },
		});
	}

	async getMe(userId: string): Promise<CurrentUserPayload> {
		const user = await this.validateUserById(userId);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}

	async validateRefreshToken(rawToken: string): Promise<{
		tokenId: string;
		user: CurrentUserPayload;
	}> {
		return this.tokenService.validateRefreshToken(rawToken);
	}

	async rotateRefreshToken(
		rawToken: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		return this.tokenService.rotateRefreshToken(rawToken);
	}

	async logout(rawToken: string | undefined): Promise<void> {
		return this.tokenService.logout(rawToken);
	}

	async forgotPassword(email: string): Promise<{ message: string }> {
		return this.passwordResetService.forgotPassword(email);
	}

	async resetPassword(
		email: string,
		code: string,
		newPassword: string,
	): Promise<{ message: string }> {
		return this.passwordResetService.resetPassword(email, code, newPassword);
	}
}
