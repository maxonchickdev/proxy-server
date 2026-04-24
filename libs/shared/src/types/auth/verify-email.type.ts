import type { SignIn } from "./sign-in.type";

export type VerifyEmail = Pick<SignIn, "email"> & {
	code: string;
};
