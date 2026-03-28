import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { authVerificationConstants } from "./auth-verification.constants";

const CODE_TTL_MS = 15 * 60 * 1000;
const SALT_ROUNDS = 10;

/**
 * Handles forgot-password and reset-password flows with time-limited codes.
 */
@Injectable()
export class PasswordResetService {
	private readonly logger = new Logger(PasswordResetService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(EmailService) private readonly email: EmailService,
	) {}

	private generateSixDigitCode(): string {
		return String(
			randomInt(
				authVerificationConstants.SIX_DIGIT_CODE_MIN_INCLUSIVE,
				authVerificationConstants.SIX_DIGIT_CODE_MAX_EXCLUSIVE,
			),
		);
	}

	/** Emails a reset code when the user exists (generic message otherwise). */
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

	/** Replaces the password when the emailed code matches and is not expired. */
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
}
