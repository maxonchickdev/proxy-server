import type { SignIn } from "./sign-in.type";

export type ForgotPassword = Omit<SignIn, "password">;
