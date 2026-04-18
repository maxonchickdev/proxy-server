import type { EmailType } from "../types/email.type";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";

export const emailRegister = registerAs(ConfigKeyEnum.EMAIL, (): EmailType => {
	const host = process.env.SMTP_HOST || "";
	const port = Number(process.env.SMTP_PORT || "");
	const user = process.env.SMTP_USER || "";
	const pass = process.env.SMTP_PASS || "";
	const from = process.env.SMTP_FROM || "";
	const logOtpOnSmtpFailure = String(process.env.SMTP_LOG_OTP_ON_FAILURE || "");

	return {
		host,
		port,
		user,
		pass,
		from,
		logOtpOnSmtpFailure: logOtpOnSmtpFailure === "true",
	};
});
