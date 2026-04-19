type RequestLogDto = {
	id: string;
	createdAt: string;
	method: string;
	path: string;
	responseStatus: number | null;
	durationMs: number | null;
	protocol?: string;
	metadata?: unknown;
	queryParams?: string | null;
};

export type { RequestLogDto };
