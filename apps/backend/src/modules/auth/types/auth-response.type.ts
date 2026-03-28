import type { UserDto } from "@proxy-server/shared";

export type AuthResponseType = {
	accessToken: string;
	user: UserDto;
};
