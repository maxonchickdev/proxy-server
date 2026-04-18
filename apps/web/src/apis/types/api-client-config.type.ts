import type { UserDto } from "@proxy-server/shared";

type ApiClientConfigType = {
	getAccessToken: () => string | null;
	setSession: (accessToken: string | null, user: UserDto | null) => void;
	onSessionExpired: () => void;
};

export type { ApiClientConfigType };
