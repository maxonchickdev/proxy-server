import type { Transporter } from "nodemailer";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { emailConstants } from "./email.constants";

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private transporter: Transporter | null = null;
	private readonly logOtpOnSmtpFailure: boolean;

	constructor(private readonly config: ConfigService) {
		const host = this.config.get<string>(`${ConfigKeyEnum.EMAIL}.host`) ?? "";
		const port =
			this.config.get<number>(`${ConfigKeyEnum.EMAIL}.port`) ??
			emailConstants.DEFAULT_SMTP_PORT;
		const user = this.config.get<string>(`${ConfigKeyEnum.EMAIL}.user`) ?? "";
		const pass = this.config.get<string>(`${ConfigKeyEnum.EMAIL}.pass`) ?? "";
		this.logOtpOnSmtpFailure =
			this.config.get<boolean>(`${ConfigKeyEnum.EMAIL}.logOtpOnSmtpFailure`) ??
			false;

		if (host) {
			const secure = port === 465;
			this.transporter = nodemailer.createTransport({
				host,
				port,
				secure,
				...(user || pass ? { auth: { user, pass } } : {}),
			});
			this.logger.log(
				`SMTP enabled: ${host}:${port} (secure=${secure}) — if mail never arrives, check provider settings and backend logs for send errors`,
			);
		} else {
			this.logger.warn(
				"SMTP_HOST is empty — verification/reset codes will be printed to logs only (dev mode).",
			);
		}
	}

	private get from(): string {
		return (
			this.config.get<string>(`${ConfigKeyEnum.EMAIL}.from`) ??
			emailConstants.DEFAULT_FROM_ADDRESS
		);
	}

	async sendVerificationCode(to: string, code: string): Promise<void> {
		const text = `Your verification code is: ${code}\n\nIt expires in 15 minutes.`;
		const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`;
		await this.sendMail(
			to,
			"Verify your email",
			text,
			html,
			"verification",
			code,
		);
	}

	async sendPasswordResetCode(to: string, code: string): Promise<void> {
		const text = `Your password reset code is: ${code}\n\nIt expires in 15 minutes.`;
		const html = `<p>Your password reset code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`;
		await this.sendMail(
			to,
			"Reset your password",
			text,
			html,
			"password-reset",
			code,
		);
	}

	private async sendMail(
		to: string,
		subject: string,
		text: string,
		html: string,
		kind: string,
		code: string,
	): Promise<void> {
		if (!this.transporter) {
			this.logger.warn(`SMTP not configured — ${kind} code for ${to}: ${code}`);
			return;
		}
		try {
			const info = await this.transporter.sendMail({
				from: this.from,
				to,
				subject,
				text,
				html,
			});
			this.logger.log(
				`Mail queued/sent (${kind}) to ${to} — messageId=${info.messageId ?? "n/a"}`,
			);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			this.logger.error(
				`SMTP send failed (${kind} to ${to}): ${msg}. ` +
					"Fix SMTP_HOST (use a real server, not smtp.example.com), port (587 or 465), and credentials. " +
					"Gmail needs an App Password if 2FA is on.",
			);
			if (this.logOtpOnSmtpFailure) {
				this.logger.warn(
					`SMTP_LOG_OTP_ON_FAILURE=true — ${kind} code for ${to}: ${code}`,
				);
			}
			throw err;
		}
	}

	async sendAlertEmail(
		to: string,
		subject: string,
		text: string,
		html: string,
	): Promise<void> {
		if (!this.transporter) {
			this.logger.warn(`SMTP not configured — alert email to ${to}: ${text}`);
			return;
		}
		await this.transporter.sendMail({
			from: this.from,
			to,
			subject,
			text,
			html,
		});
	}
}
