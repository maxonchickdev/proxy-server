import { randomInt } from "node:crypto";
import { AuthVerification } from "../constsants/auth-verification.constant";

export function generateSixDigitCodeUtil(): string {
	return String(
		randomInt(
			AuthVerification.SixDigitCodeMinInclusive,
			AuthVerification.SixDigitCodeMaxInclusive,
		),
	);
}
