import type { RefreshRequestAuth } from "./refresh-request.type";

export type RequestWithRefreshAuth = {
	cookies?: Record<string, string>;
	refreshAuth?: RefreshRequestAuth;
};
