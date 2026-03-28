/** Bounds for emailed numeric verification / reset codes. */
export const authVerificationConstants = {
	SIX_DIGIT_CODE_MIN_INCLUSIVE: 100_000,
	SIX_DIGIT_CODE_MAX_EXCLUSIVE: 1_000_000,
} as const;
