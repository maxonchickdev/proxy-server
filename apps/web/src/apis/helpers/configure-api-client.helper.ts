import type { ApiClientConfigType } from "../types/api-client-config.type";

let clientConfig: ApiClientConfigType | null = null;

const configureApiClientHelper = (c: ApiClientConfigType): void => {
	clientConfig = c;
};

const getApiClientConfig = (): ApiClientConfigType => {
	if (!clientConfig) {
		throw new Error("API client not configured");
	}
	return clientConfig;
};

export { configureApiClientHelper, getApiClientConfig };
