import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
	authApi,
	configureApiClient,
	refreshAccessToken,
} from "../api/client.api";
import type { UserDto } from "../types/user.type";

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
	const [user, setUser] = useState<UserDto | null>(null);
	const [accessToken, setAccessTokenState] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const accessTokenRef = useRef<string | null>(null);
	accessTokenRef.current = accessToken;

	const setSession = useCallback((token: string, u: UserDto) => {
		accessTokenRef.current = token;
		setAccessTokenState(token);
		setUser(u);
	}, []);

	const clearSession = useCallback(() => {
		accessTokenRef.current = null;
		setAccessTokenState(null);
		setUser(null);
	}, []);

	const onSessionExpired = useCallback(() => {
		clearSession();
		void navigate("/login", { replace: true });
	}, [clearSession, navigate]);

	useEffect(() => {
		configureApiClient({
			getAccessToken: () => accessTokenRef.current,
			setSession: (token, u) => {
				if (token && u) {
					accessTokenRef.current = token;
					setAccessTokenState(token);
					setUser(u);
				} else {
					clearSession();
				}
			},
			onSessionExpired,
		});
	}, [clearSession, onSessionExpired]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const data = await refreshAccessToken();
			if (cancelled) return;
			if (data) {
				accessTokenRef.current = data.accessToken;
				setAccessTokenState(data.accessToken);
				setUser(data.user);
			}
			setIsReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!accessToken) return;
		const id = window.setInterval(() => {
			void refreshAccessToken().then((data) => {
				if (data) {
					accessTokenRef.current = data.accessToken;
					setAccessTokenState(data.accessToken);
					setUser(data.user);
				}
			});
		}, ACCESS_REFRESH_MS);
		return () => window.clearInterval(id);
	}, [accessToken]);

	const logout = useCallback(async () => {
		const t = accessTokenRef.current;
		try {
			await authApi.logout(t);
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
