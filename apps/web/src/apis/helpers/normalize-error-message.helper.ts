export const normalizeErrorMessageHelper = (message: unknown): string => {
	if (Array.isArray(message)) {
		return message.map((m) => String(m)).join(". ");
	}
	if (typeof message === "string" && message.length > 0) return message;
	return "Request failed";
};
