import type { CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

export type RefreshRequestAuth = {
	rawRefreshToken: string;
	tokenId: string;
	user: CurrentUserPayload;
};
