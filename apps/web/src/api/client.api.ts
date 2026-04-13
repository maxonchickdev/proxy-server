import type {
	AnalyticsBreakdownDto,
	AnalyticsSummaryDto,
	AnalyticsTimeseriesPointDto,
	EndpointDto,
	EndpointListResponseDto,
	ErrorResponseBody,
	RateLimitConfig,
	TransformRule,
	UserDto,
} from "@proxy-server/shared";
import type { RequestLogDto } from "@/types/request-log.dto";

const API_BASE = "";

const AUTH_401_NO_REFRESH = new Set([
	"/auth/sign-in",
	"/auth/sign-up",
	"/auth/verify-email",
	"/auth/resend-verification",
	"/auth/forgot-password",
	"/auth/reset-password",
]);

type ApiClientConfig = {
	getAccessToken: () => string | null;
	setSession: (accessToken: string | null, user: UserDto | null) => void;
	onSessionExpired: () => void;
};

let clientConfig: ApiClientConfig | null = null;

export function configureApiClient(c: ApiClientConfig): void {
	clientConfig = c;
}

function assertConfig(): ApiClientConfig {
	if (!clientConfig) {
		throw new Error("API client not configured");
	}
	return clientConfig;
}

function normalizeErrorMessage(message: unknown): string {
	if (Array.isArray(message)) {
		return message.map((m) => String(m)).join(". ");
	}
	if (typeof message === "string" && message.length > 0) return message;
	return "Request failed";
}

function errorMessageFromParsedBody(body: unknown): string | null {
	if (!body || typeof body !== "object") return null;
	const r = body as Partial<ErrorResponseBody>;
	if (r.message != null) return normalizeErrorMessage(r.message);
	if (typeof r.error === "string" && r.error.length > 0) return r.error;
	return null;
}

async function parseResponse<T>(res: Response): Promise<T> {
	const text = await res.text();
	if (!text) {
		if (!res.ok) throw new Error(res.statusText || "Request failed");
		return {} as T;
	}
	try {
		const data = JSON.parse(text) as T;
		if (!res.ok) {
			const fromBody = errorMessageFromParsedBody(data);
			throw new Error(fromBody ?? (text || res.statusText || "Request failed"));
		}
		return data;
	} catch (e) {
		if (e instanceof SyntaxError) throw new Error(text || res.statusText);
		throw e;
	}
}

type RefreshSessionResult = { accessToken: string; user: UserDto } | null;

let refreshInFlight: Promise<RefreshSessionResult> | null = null;

export async function refreshAccessToken(): Promise<RefreshSessionResult> {
	if (refreshInFlight !== null) {
		return refreshInFlight;
	}
	refreshInFlight = (async (): Promise<RefreshSessionResult> => {
		try {
			const res = await fetch(`${API_BASE}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) {
				return null;
			}
			return await parseResponse<{ accessToken: string; user: UserDto }>(res);
		} catch {
			return null;
		}
	})().finally(() => {
		refreshInFlight = null;
	});
	return refreshInFlight;
}

async function api<T>(
	path: string,
	options: RequestInit = {},
	retried = false,
): Promise<T> {
	const cfg = assertConfig();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};
	const token = cfg.getAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers,
		credentials: "include",
	});
	if (res.status === 401 && !retried && !AUTH_401_NO_REFRESH.has(path)) {
		const refreshed = await refreshAccessToken();
		if (refreshed) {
			cfg.setSession(refreshed.accessToken, refreshed.user);
			return api<T>(path, options, true);
		}
		cfg.onSessionExpired();
		throw new Error("Unauthorized");
	}
	return parseResponse<T>(res);
}

export const authApi = {
	register: (data: { email: string; password: string; name?: string }) =>
		api<{ message: string }>("/auth/sign-up", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	login: (data: { email: string; password: string }) =>
		api<{ accessToken: string; user: UserDto }>("/auth/sign-in", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	verifyEmail: (data: { email: string; code: string }) =>
		api<{ accessToken: string; user: UserDto }>("/auth/verify-email", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	resendVerification: (data: { email: string }) =>
		api<{ message: string }>("/auth/resend-verification", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	forgotPassword: (data: { email: string }) =>
		api<{ message: string }>("/auth/forgot-password", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	resetPassword: (data: { email: string; code: string; newPassword: string }) =>
		api<{ message: string }>("/auth/reset-password", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	me: () => api<UserDto>("/auth/me"),
	logout: async (accessToken: string | null) => {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
		await fetch(`${API_BASE}/auth/logout`, {
			method: "POST",
			credentials: "include",
			headers,
		});
	},
};

export type EndpointListResponse = EndpointListResponseDto;

export const endpointsApi = {
	list: (params?: { limit?: number; offset?: number }) => {
		const search = new URLSearchParams();
		if (params?.limit != null) search.set("limit", String(params.limit));
		if (params?.offset != null) search.set("offset", String(params.offset));
		const qs = search.toString();
		return api<EndpointListResponseDto>(`/endpoints${qs ? `?${qs}` : ""}`);
	},
	create: (data: {
		name: string;
		targetUrl: string;
		rateLimitConfig?: RateLimitConfig;
		transformRules?: TransformRule[];
		isActive?: boolean;
	}) =>
		api<EndpointDto>("/endpoints", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	get: (id: string) => api<EndpointDto>(`/endpoints/${id}`),
	update: (
		id: string,
		data: {
			name?: string;
			targetUrl?: string;
			rateLimitConfig?: RateLimitConfig | null;
			transformRules?: TransformRule[] | null;
			isActive?: boolean;
		},
	) =>
		api<EndpointDto>(`/endpoints/${id}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		}),
	delete: (id: string) =>
		api<{ success: boolean }>(`/endpoints/${id}`, { method: "DELETE" }),
};

export const logsApi = {
	byEndpoint: (
		endpointId: string,
		params?: {
			limit?: number;
			offset?: number;
			method?: string;
			status?: number;
		},
	) => {
		const search = new URLSearchParams();
		if (params?.limit) search.set("limit", String(params.limit));
		if (params?.offset) search.set("offset", String(params.offset));
		if (params?.method) search.set("method", params.method);
		if (params?.status) search.set("status", String(params.status));
		const q = search.toString();
		return api<{ logs: RequestLogDto[]; total: number }>(
			`/logs/endpoint/${endpointId}${q ? `?${q}` : ""}`,
		);
	},
	get: (id: string) => api<RequestLogDto>(`/logs/${id}`),
	replay: (id: string) =>
		api<{
			newLogId: string;
			responseStatus: number | null;
			responseBody: string | null;
			durationMs: number;
		}>(`/logs/${id}/replay`, { method: "POST" }),
};

type NotificationChannelDto = {
	id: string;
	userId: string;
	type: string;
	config: unknown;
	isActive: boolean;
	createdAt: string;
};

export const notificationsApi = {
	channels: (params?: { limit?: number; offset?: number }) => {
		const search = new URLSearchParams();
		if (params?.limit != null) search.set("limit", String(params.limit));
		if (params?.offset != null) search.set("offset", String(params.offset));
		const qs = search.toString();
		return api<{
			items: NotificationChannelDto[];
			total: number;
			limit: number;
			offset: number;
		}>(`/notifications/channels${qs ? `?${qs}` : ""}`);
	},
	createReportSchedule: (data: {
		channelId: string;
		frequency: "DAILY" | "WEEKLY";
	}) =>
		api<{ id: string; frequency: string; channelId: string }>(
			"/notifications/report-schedules",
			{ method: "POST", body: JSON.stringify(data) },
		),
	listReportSchedules: () =>
		api<
			Array<{
				id: string;
				userId: string;
				channelId: string;
				frequency: string;
				isActive: boolean;
				createdAt: string;
			}>
		>("/notifications/report-schedules"),
	deleteReportSchedule: (id: string) =>
		api<{ success: boolean }>(`/notifications/report-schedules/${id}`, {
			method: "DELETE",
		}),
};

export const analyticsApi = {
	summary: (endpointId: string) =>
		api<AnalyticsSummaryDto>(`/analytics/${endpointId}/summary`),
	timeseries: (
		endpointId: string,
		params?: { bucket?: "hour" | "day"; limit?: number },
	) => {
		const search = new URLSearchParams();
		if (params?.bucket) search.set("bucket", params.bucket);
		if (params?.limit) search.set("limit", String(params.limit));
		const q = search.toString();
		return api<AnalyticsTimeseriesPointDto[]>(
			`/analytics/${endpointId}/timeseries${q ? `?${q}` : ""}`,
		);
	},
	breakdown: (endpointId: string) =>
		api<AnalyticsBreakdownDto>(`/analytics/${endpointId}/breakdown`),
};
