export type ErrorResponseBody = {
	statusCode: number;
	error: string;
	message: string | string[];
	path?: string;
	timestamp?: string;
};

export type HttpExceptionResponse =
	| string
	| { message?: string | string[]; error?: string; statusCode?: number };
