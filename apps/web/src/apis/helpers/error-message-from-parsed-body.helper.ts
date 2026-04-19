import type { ErrorResponseBody } from "@proxy-server/shared";
import { normalizeErrorMessageHelper } from "./normalize-error-message.helper";

export const errorMessageFromParsedBodyHelper = (
	body: unknown,
): string | null => {
	if (!body || typeof body !== "object") return null;
	const r = body as Partial<ErrorResponseBody>;
	if (r.message != null) return normalizeErrorMessageHelper(r.message);
	if (typeof r.error === "string" && r.error.length > 0) return r.error;
	return null;
};
