import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AuthCrypto } from "./constsants/auth-crypto.constant";
import { generateSixDigitCodeUtil } from "./utils/auth-code.util";

@Injectable()
export class PasswordResetService {
	private readonly logger = new Logger(PasswordResetService.name);

	constructor(
		@Inject(PrismaService) private readonly prismaService: PrismaService,
		@Inject(EmailService) private readonly emailService: EmailService,
	) {}

	async forgotPassword(email: string): Promise<{ message: string }> {
		const emailLower = email.toLowerCase();
		const user = await this.prismaService.user.findUnique({
			where: { email: emailLower },
		});
		if (!user) {
			return { message: "If an account exists, a reset code was sent." };
		}
		const plainCode = generateSixDigitCodeUtil();
		const passwordResetCodeHash = await bcrypt.hash(
			plainCode,
			AuthCrypto.SaltRounds,
		);
		await this.prismaService.user.update({
			where: { id: user.id },
			data: {
				passwordResetCodeHash,
				passwordResetExpiresAt: new Date(Date.now() + AuthCrypto.CodeTtlMs),
			},
		});
		await this.emailService
			.sendPasswordResetCode(emailLower, plainCode)
			.catch((e) => {
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
		const user = await this.prismaService.user.findUnique({
			where: { email: emailLower },
		});
		if (
			!user?.passwordResetCodeHash ||
			!user.passwordResetExpiresAt ||
			user.passwordResetExpiresAt < new Date()
		) {
			throw new UnauthorizedException("Invalid or expired reset code");
		}
		const ok = await bcrypt.compare(code, user.passwordResetCodeHash);
		if (!ok) {
			throw new UnauthorizedException("Invalid or expired reset code");
		}
		const passwordHash = await bcrypt.hash(newPassword, AuthCrypto.SaltRounds);
		await this.prismaService.$transaction([
			this.prismaService.user.update({
				where: { id: user.id },
				data: {
					passwordHash,
					passwordResetCodeHash: null,
					passwordResetExpiresAt: null,
				},
			}),
			this.prismaService.refreshToken.updateMany({
				where: { userId: user.id },
				data: { isRevoked: true },
			}),
		]);
		return { message: "Password has been reset. You can sign in now." };
	}
}
