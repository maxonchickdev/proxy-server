import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { EmailType } from "../types/email.type.js";

export const emailRegister = registerAs(
	ConfigKeyEnum.EMAIL,
	(): EmailType => ({
		host: (process.env.SMTP_HOST ?? "").trim(),
		port: Number(process.env.SMTP_PORT) || 587,
		user: (process.env.SMTP_USER ?? "").trim(),
		pass: process.env.SMTP_PASS ?? "",
		from: process.env.SMTP_FROM ?? "Proxy Server <noreply@localhost>",
		logOtpOnSmtpFailure:
			String(process.env.SMTP_LOG_OTP_ON_FAILURE ?? "").toLowerCase() ===
			"true",
	}),
);
