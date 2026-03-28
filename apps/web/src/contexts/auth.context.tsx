import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
	authApi,
	configureApiClient,
	refreshAccessToken,
} from "@/api/client.api";
import type { UserDto } from "@proxy-server/shared";

const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const;

type AuthSession = { accessToken: string; user: UserDto } | null;

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
	const accessTokenRef = useRef<string | null>(null);
	const sessionQuery = useQuery({
		queryKey: AUTH_SESSION_QUERY_KEY,
		queryFn: async (): Promise<AuthSession> => refreshAccessToken(),
		refetchInterval: (query) => {
			const data = query.state.data;
			if (data?.accessToken) return ACCESS_REFRESH_MS;
			return false;
		},
		staleTime: 0,
	});
	const session = sessionQuery.data;
	const user = session?.user ?? null;
	const accessToken = session?.accessToken ?? null;
	const isReady = !sessionQuery.isPending;
	useLayoutEffect(() => {
		if (sessionQuery.data === undefined) return;
		accessTokenRef.current = sessionQuery.data?.accessToken ?? null;
	}, [sessionQuery.data]);
	const setSession = useCallback(
		(token: string, u: UserDto) => {
			accessTokenRef.current = token;
			queryClient.setQueryData<AuthSession>(AUTH_SESSION_QUERY_KEY, {
				accessToken: token,
				user: u,
			});
		},
		[queryClient],
	);
	const clearSession = useCallback(() => {
		accessTokenRef.current = null;
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
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};
