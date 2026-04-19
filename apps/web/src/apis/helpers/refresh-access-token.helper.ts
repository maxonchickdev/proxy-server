import type { UserDto } from "@proxy-server/shared";
import type { RefreshSessionResultType } from "../types/refresh-session-result.type";
import { toApiUrl } from "./api-url.helper";
import { parseResponseHelper } from "./parse-response.helper";

let refreshInFlight: Promise<RefreshSessionResultType> | null = null;

const refreshAccessTokenHelper =
	async (): Promise<RefreshSessionResultType> => {
		if (refreshInFlight !== null) {
			return refreshInFlight;
		}
		refreshInFlight = (async (): Promise<RefreshSessionResultType> => {
			try {
				const res = await fetch(toApiUrl("/auth/refresh"), {
					method: "POST",
					credentials: "include",
				});
				if (!res.ok) {
					return null;
				}
				return await parseResponseHelper<{
					accessToken: string;
					user: UserDto;
				}>(res);
			} catch {
				return null;
			}
		})().finally(() => {
			refreshInFlight = null;
		});
		return refreshInFlight;
	};

export { refreshAccessTokenHelper };
