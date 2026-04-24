import type { SignUp } from "./sign-up.type";

export type SignIn = Omit<SignUp, "name">;
