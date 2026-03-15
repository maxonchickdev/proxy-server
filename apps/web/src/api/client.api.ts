const API_BASE = "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(res.statusText || "Request failed");
    return {} as T;
  }
  try {
    const data = JSON.parse(text) as T & { message?: string; error?: string };
    if (!res.ok) {
      throw new Error(
        (data as { message?: string })?.message ??
          (data as { error?: string })?.error ??
          text,
      );
    }
    return data as T;
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(text || res.statusText);
    throw e;
  }
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api<{
      accessToken: string;
      user: { id: string; email: string; name: string | null };
    }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    api<{
      accessToken: string;
      user: { id: string; email: string; name: string | null };
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

export const endpointsApi = {
  list: () =>
    api<
      Array<{
        id: string;
        name: string;
        slug: string;
        targetUrl: string;
        isActive: boolean;
        createdAt: string;
      }>
    >("/endpoints"),
  create: (data: { name: string; targetUrl: string; isActive?: boolean }) =>
    api<{
      id: string;
      name: string;
      slug: string;
      targetUrl: string;
      isActive: boolean;
    }>("/endpoints", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) =>
    api<{
      id: string;
      name: string;
      slug: string;
      targetUrl: string;
      isActive: boolean;
    }>(`/endpoints/${id}`),
  update: (
    id: string,
    data: { name?: string; targetUrl?: string; isActive?: boolean },
  ) =>
    api<{
      id: string;
      name: string;
      slug: string;
      targetUrl: string;
      isActive: boolean;
    }>(`/endpoints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
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
    return api<{ logs: Array<Record<string, unknown>>; total: number }>(
      `/logs/endpoint/${endpointId}${q ? `?${q}` : ""}`,
    );
  },
  get: (id: string) => api<Record<string, unknown>>(`/logs/${id}`),
};

export const analyticsApi = {
  summary: (endpointId: string) =>
    api<{
      totalRequests: number;
      requestsLast24h: number;
      avgLatencyMs: number;
      uptimePercent: number;
      errorRate: number;
    }>(`/analytics/${endpointId}/summary`),
  timeseries: (
    endpointId: string,
    params?: { bucket?: "hour" | "day"; limit?: number },
  ) => {
    const search = new URLSearchParams();
    if (params?.bucket) search.set("bucket", params.bucket);
    if (params?.limit) search.set("limit", String(params.limit));
    const q = search.toString();
    return api<
      Array<{ bucket: string; requests: number; avgLatencyMs: number }>
    >(`/analytics/${endpointId}/timeseries${q ? `?${q}` : ""}`);
  },
  breakdown: (endpointId: string) =>
    api<{
      byMethod: Array<{ method: string; count: number }>;
      byStatus: Array<{ status: number; count: number }>;
    }>(`/analytics/${endpointId}/breakdown`),
};
