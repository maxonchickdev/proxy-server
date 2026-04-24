import type { VerifyEmail } from "./verify-email.type";

export type ResetPassword = VerifyEmail & {
	newPassword: string;
};
