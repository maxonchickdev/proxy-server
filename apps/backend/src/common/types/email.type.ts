export type EmailType = {
	host: string;
	port: number;
	user: string;
	pass: string;
	from: string;
	/** If true, log OTP to server logs when SMTP send fails (local debugging only). */
	logOtpOnSmtpFailure: boolean;
};
