import type { SignIn } from "./sign-in.type";

export type ResendVerification = Omit<SignIn, "password">;
