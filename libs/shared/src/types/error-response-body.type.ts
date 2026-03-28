/** Stable JSON error body from the global exception filter. */
export type ErrorResponseBody = {
	error: string;
	message: string | string[];
	path: string;
	statusCode: number;
	timestamp: string;
};
