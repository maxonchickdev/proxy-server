import type { RefreshRequestAuth } from "./refresh-request.type";

export type RequestWithRefreshAuthType = {
	cookies?: Record<string, string>;
	refreshAuth?: RefreshRequestAuth;
};
