import { errorMessageFromParsedBodyHelper } from "./error-message-from-parsed-body.helper";

export const parseResponseHelper = async <T>(res: Response): Promise<T> => {
	const text = await res.text();
	if (!text) {
		if (!res.ok) throw new Error(res.statusText || "Request failed");
		return {} as T;
	}
	try {
		const data = JSON.parse(text) as T;
		if (!res.ok) {
			const fromBody = errorMessageFromParsedBodyHelper(data);
			throw new Error(fromBody ?? (text || res.statusText || "Request failed"));
		}
		return data;
	} catch (e) {
		if (e instanceof SyntaxError) throw new Error(text || res.statusText);
		throw e;
	}
};
