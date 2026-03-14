export declare function api<T>(path: string, options?: RequestInit): Promise<T>;
export declare const authApi: {
    register: (data: {
        email: string;
        password: string;
        name?: string;
    }) => Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
    login: (data: {
        email: string;
        password: string;
    }) => Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
};
export declare const endpointsApi: {
    list: () => Promise<{
        id: string;
        name: string;
        slug: string;
        targetUrl: string;
        isActive: boolean;
        createdAt: string;
    }[]>;
    create: (data: {
        name: string;
        targetUrl: string;
        isActive?: boolean;
    }) => Promise<{
        id: string;
        name: string;
        slug: string;
        targetUrl: string;
        isActive: boolean;
    }>;
    get: (id: string) => Promise<{
        id: string;
        name: string;
        slug: string;
        targetUrl: string;
        isActive: boolean;
    }>;
    update: (id: string, data: {
        name?: string;
        targetUrl?: string;
        isActive?: boolean;
    }) => Promise<{
        id: string;
        name: string;
        slug: string;
        targetUrl: string;
        isActive: boolean;
    }>;
    delete: (id: string) => Promise<{
        success: boolean;
    }>;
};
export declare const logsApi: {
    byEndpoint: (endpointId: string, params?: {
        limit?: number;
        offset?: number;
        method?: string;
        status?: number;
    }) => Promise<{
        logs: Array<Record<string, unknown>>;
        total: number;
    }>;
    get: (id: string) => Promise<Record<string, unknown>>;
};
export declare const analyticsApi: {
    summary: (endpointId: string) => Promise<{
        totalRequests: number;
        requestsLast24h: number;
        avgLatencyMs: number;
        uptimePercent: number;
        errorRate: number;
    }>;
    timeseries: (endpointId: string, params?: {
        bucket?: "hour" | "day";
        limit?: number;
    }) => Promise<{
        bucket: string;
        requests: number;
        avgLatencyMs: number;
    }[]>;
    breakdown: (endpointId: string) => Promise<{
        byMethod: Array<{
            method: string;
            count: number;
        }>;
        byStatus: Array<{
            status: number;
            count: number;
        }>;
    }>;
};
