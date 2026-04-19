import type { ApiClientConfigType } from "../types/api-client-config.type";

let clientConfig: ApiClientConfigType | null = null;

export const configureApiClientHelper = (c: ApiClientConfigType): void => {
	clientConfig = c;
};

export const getApiClientConfig = (): ApiClientConfigType => {
	if (!clientConfig) {
		throw new Error("API client not configured");
	}
	return clientConfig;
};
