/** Shape returned by logs API for a single request log row. */
export type RequestLogDto = {
	id: string;
	createdAt: string;
	method: string;
	path: string;
	responseStatus: number | null;
	durationMs: number | null;
};
