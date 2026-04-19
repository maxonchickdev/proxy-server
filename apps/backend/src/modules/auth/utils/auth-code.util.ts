import { randomInt } from "node:crypto";
import { authVerificationConst } from "../consts/auth-verification.const";

export function generateSixDigitCodeUtil(): string {
	return String(
		randomInt(
			authVerificationConst.sixDigitCodeMinInclusive,
			authVerificationConst.sixDigitCodeMaxInclusive,
		),
	);
}
