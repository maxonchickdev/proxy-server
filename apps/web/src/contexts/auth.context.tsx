import type { UserDto } from "@proxy-server/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
	authApi,
	configureApiClient,
	refreshAccessToken,
} from "@/apis/client.api";

const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const;

const SESSION_STORAGE_KEY = "proxy-server.session";

const LEGACY_ACCESS_TOKEN_KEY = "proxy-server.accessToken";

type AuthSession = { accessToken: string; user: UserDto } | null;

function parseStoredUser(value: unknown): UserDto | null {
	if (!value || typeof value !== "object") {
		return null;
	}
	const o = value as Record<string, unknown>;
	if (typeof o.id !== "string" || typeof o.email !== "string") {
		return null;
	}
	if (o.name !== null && typeof o.name !== "string") {
		return null;
	}
	return { id: o.id, email: o.email, name: o.name as string | null };
}

function readStoredSession(): AuthSession | undefined {
	if (typeof sessionStorage === "undefined") {
		return undefined;
	}
	try {
		const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
		if (!raw) {
			return undefined;
		}
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") {
			return undefined;
		}
		const o = parsed as Record<string, unknown>;
		if (typeof o.accessToken !== "string" || o.accessToken.length === 0) {
			return undefined;
		}
		const user = parseStoredUser(o.user);
		if (!user) {
			return undefined;
		}
		return { accessToken: o.accessToken, user };
	} catch {
		return undefined;
	}
}

function readLegacyAccessTokenOnly(): string | null {
	if (typeof sessionStorage === "undefined") {
		return null;
	}
	try {
		const t = sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
		return t && t.length > 0 ? t : null;
	} catch {
		return null;
	}
}

function readBootstrapAccessToken(): string | null {
	const full = readStoredSession();
	if (full) {
		return full.accessToken;
	}
	return readLegacyAccessTokenOnly();
}

function writeStoredSession(session: AuthSession): void {
	if (typeof sessionStorage === "undefined") {
		return;
	}
	try {
		sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
		if (session?.accessToken && session.user) {
			sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
		} else {
			sessionStorage.removeItem(SESSION_STORAGE_KEY);
		}
	} catch {
		/* ignore quota / privacy mode */
	}
}

interface AuthContextValue {
	user: UserDto | null;
	accessToken: string | null;
	isReady: boolean;
	setSession: (accessToken: string, user: UserDto) => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_REFRESH_MS = 14 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const accessTokenRef = useRef<string | null>(readBootstrapAccessToken());
	const sessionQuery = useQuery({
		queryKey: AUTH_SESSION_QUERY_KEY,
		queryFn: async (): Promise<AuthSession> => refreshAccessToken(),
		refetchInterval: (query) => {
			const data = query.state.data;
			if (data?.accessToken) {
				return ACCESS_REFRESH_MS;
			}
			return false;
		},
		staleTime: 0,
		refetchOnWindowFocus: false,
	});
	const session = sessionQuery.data;
	const user = session?.user ?? null;
	const accessToken = session?.accessToken ?? null;

	const isReady = !sessionQuery.isPending;
	if (sessionQuery.data !== undefined) {
		const nextToken = sessionQuery.data?.accessToken ?? null;
		accessTokenRef.current = nextToken;
		writeStoredSession(sessionQuery.data ?? null);
	}
	const setSession = useCallback(
		(token: string, u: UserDto) => {
			accessTokenRef.current = token;
			writeStoredSession({ accessToken: token, user: u });
			queryClient.setQueryData<AuthSession>(AUTH_SESSION_QUERY_KEY, {
				accessToken: token,
				user: u,
			});
		},
		[queryClient],
	);
	const clearSession = useCallback(() => {
		accessTokenRef.current = null;
		writeStoredSession(null);
		queryClient.setQueryData<AuthSession>(AUTH_SESSION_QUERY_KEY, null);
	}, [queryClient]);
	const onSessionExpired = useCallback(() => {
		clearSession();
		void navigate("/login", { replace: true });
	}, [clearSession, navigate]);
	useLayoutEffect(() => {
		configureApiClient({
			getAccessToken: () => accessTokenRef.current,
			setSession: (token, u) => {
				if (token && u) {
					accessTokenRef.current = token;
					writeStoredSession({ accessToken: token, user: u });
					queryClient.setQueryData<AuthSession>(AUTH_SESSION_QUERY_KEY, {
						accessToken: token,
						user: u,
					});
				} else {
					clearSession();
				}
			},
			onSessionExpired,
		});
	}, [clearSession, onSessionExpired, queryClient]);
	const logout = useCallback(async () => {
		const token = accessTokenRef.current;
		try {
			await authApi.logout(token);
		} catch {
			/* ignore */
		}
		clearSession();
		queryClient.clear();
		void navigate("/login", { replace: true });
	}, [clearSession, navigate, queryClient]);
	const value = useMemo(
		() => ({
			user,
			accessToken,
			isReady,
			setSession,
			logout,
		}),
		[user, accessToken, isReady, setSession, logout],
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
};

export function useCanQueryProtectedApi(): boolean {
	const { isReady, accessToken } = useAuth();
	return isReady && Boolean(accessToken);
}
