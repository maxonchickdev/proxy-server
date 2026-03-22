import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { nanoid } from "nanoid";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import type { SignInDto } from "./dto/sign-in.dto";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { AuthResponseType } from "./types/auth-response.type";
import type { JwtPayloadType } from "./types/jwt-payload.type";
import { parseDurationToMs } from "./utils/duration.util";
import { hashOpaqueToken } from "./utils/token-hash.util";

const CODE_TTL_MS = 15 * 60 * 1000;
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(ConfigService) private readonly config: ConfigService,
		@Inject(EmailService) private readonly email: EmailService,
	) {}

	private generateSixDigitCode(): string {
		return String(randomInt(100_000, 1_000_000));
	}

	private get refreshExpiresMs(): number {
		const s = this.config.getOrThrow<string>(
			`${ConfigKeyEnum.JWT}.refreshExpiresIn`,
		);
		return parseDurationToMs(s);
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

		return this.issueTokensForUserId(user.id);
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
		return this.issueTokensForUserId(user.id);
	}

	async validateUserById(userId: string) {
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
		const tokenHash = hashOpaqueToken(rawToken);
		const row = await this.prisma.refreshToken.findUnique({
			where: { tokenHash },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						isEmailVerified: true,
					},
				},
			},
		});
		if (
			!row ||
			row.isRevoked ||
			row.expiresAt < new Date() ||
			!row.user.isEmailVerified
		) {
			throw new UnauthorizedException("Invalid or expired session");
		}
		return {
			tokenId: row.id,
			user: {
				id: row.user.id,
				email: row.user.email,
				name: row.user.name,
			},
		};
	}

	async rotateRefreshToken(
		rawToken: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const { tokenId, user } = await this.validateRefreshToken(rawToken);
		await this.prisma.refreshToken.update({
			where: { id: tokenId },
			data: { isRevoked: true },
		});
		return this.issueTokensForUser(user);
	}

	async logout(rawToken: string | undefined): Promise<void> {
		if (!rawToken) return;
		const tokenHash = hashOpaqueToken(rawToken);
		await this.prisma.refreshToken.updateMany({
			where: { tokenHash, isRevoked: false },
			data: { isRevoked: true },
		});
	}

	async forgotPassword(email: string): Promise<{ message: string }> {
		const emailLower = email.toLowerCase();
		const user = await this.prisma.user.findUnique({
			where: { email: emailLower },
		});
		if (!user) {
			return { message: "If an account exists, a reset code was sent." };
		}
		const plainCode = this.generateSixDigitCode();
		const passwordResetCodeHash = await bcrypt.hash(plainCode, SALT_ROUNDS);
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				passwordResetCodeHash,
				passwordResetExpiresAt: new Date(Date.now() + CODE_TTL_MS),
			},
		});
		await this.email.sendPasswordResetCode(emailLower, plainCode).catch((e) => {
			this.logger.error(`Failed to send reset email: ${e}`);
		});
		return { message: "If an account exists, a reset code was sent." };
	}

	async resetPassword(
		email: string,
		code: string,
		newPassword: string,
	): Promise<{ message: string }> {
		const emailLower = email.toLowerCase();
		const user = await this.prisma.user.findUnique({
			where: { email: emailLower },
		});
		if (
			!user ||
			!user.passwordResetCodeHash ||
			!user.passwordResetExpiresAt ||
			user.passwordResetExpiresAt < new Date()
		) {
			throw new UnauthorizedException("Invalid or expired reset code");
		}
		const ok = await bcrypt.compare(code, user.passwordResetCodeHash);
		if (!ok) {
			throw new UnauthorizedException("Invalid or expired reset code");
		}
		const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
		await this.prisma.$transaction([
			this.prisma.user.update({
				where: { id: user.id },
				data: {
					passwordHash,
					passwordResetCodeHash: null,
					passwordResetExpiresAt: null,
				},
			}),
			this.prisma.refreshToken.updateMany({
				where: { userId: user.id },
				data: { isRevoked: true },
			}),
		]);
		return { message: "Password has been reset. You can sign in now." };
	}

	private async issueTokensForUserId(
		userId: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const user = await this.validateUserById(userId);
		if (!user) {
			throw new UnauthorizedException();
		}
		return this.issueTokensForUser(user);
	}

	private async issueTokensForUser(
		user: CurrentUserPayload,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const payload: JwtPayloadType = { sub: user.id, email: user.email };
		const accessToken = this.jwtService.sign(payload);
		const rawRefresh = nanoid(64);
		const tokenHash = hashOpaqueToken(rawRefresh);
		const expiresAt = new Date(Date.now() + this.refreshExpiresMs);
		await this.prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash,
				expiresAt,
			},
		});
		return {
			accessToken,
			refreshToken: rawRefresh,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		};
	}
}
