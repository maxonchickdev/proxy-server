export type AppType = {
	appPort: number;
	appRequestTimeout: number;
	/** Comma-separated origins for CORS (e.g. http://localhost:5173) */
	corsOrigins: string[];
};
