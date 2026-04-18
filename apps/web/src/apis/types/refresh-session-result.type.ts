import type { UserDto } from "@proxy-server/shared";

type RefreshSessionResultType = { accessToken: string; user: UserDto } | null;

export type { RefreshSessionResultType };
