import { API_V1_BASE_PATH } from "../consts/api-base-path.const";

const toApiUrl = (path: string): string => {
	if (!path.startsWith("/")) {
		return path;
	}
	if (path.startsWith(API_V1_BASE_PATH)) {
		return path;
	}
	return `${API_V1_BASE_PATH}${path}`;
};

export { toApiUrl };
