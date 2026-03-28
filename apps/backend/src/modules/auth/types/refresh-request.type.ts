import type { CurrentUserPayload } from "../../../common/types/current-user-payload.type";

export type RefreshRequestAuth = {
	rawRefreshToken: string;
	tokenId: string;
	user: CurrentUserPayload;
};
