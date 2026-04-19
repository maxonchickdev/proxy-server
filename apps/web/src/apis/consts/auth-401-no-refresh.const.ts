import { toApiUrl } from "../helpers/api-url.helper";

const auth401NoRefreshConst = new Set([
	toApiUrl("/auth/sign-in"),
	toApiUrl("/auth/sign-up"),
	toApiUrl("/auth/verify-email"),
	toApiUrl("/auth/resend-verification"),
	toApiUrl("/auth/forgot-password"),
	toApiUrl("/auth/reset-password"),
]);

export { auth401NoRefreshConst };
