import type { UserDto } from "@proxy-server/shared";

/** JWT-validated user attached to `request.user`. */
export type CurrentUserPayload = UserDto;
