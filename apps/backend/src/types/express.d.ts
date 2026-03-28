declare global {
	namespace Express {
		interface Request {
			/** Propagated from `X-Correlation-ID` or generated per request. */
			correlationId?: string;
		}
	}
}

export {};
