import { z } from "zod";

const viteEnvSchema = z.object({
	VITE_API_URL: z.preprocess(
		(v: unknown) =>
			v === "" || v === undefined ? undefined : String(v).trim(),
		z.string().url().optional(),
	),
});

type WebEnv = {
	/** Public API origin for building proxy URLs (e.g. `https://api.example.com`). */
	publicApiOrigin: string;
};

let cachedWebEnv: WebEnv | null = null;

/**
 * Validates `VITE_*` at startup. When `VITE_API_URL` is unset, uses same heuristic as before for local dev.
 */
export function initWebEnv(): WebEnv {
	const parsed = viteEnvSchema.safeParse(import.meta.env);
	if (!parsed.success) {
		const detail = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`Invalid VITE_* environment: ${detail}`);
	}
	const configured = parsed.data.VITE_API_URL;
	if (configured) {
		cachedWebEnv = {
			publicApiOrigin: configured.replace(/\/$/, ""),
		};
		return cachedWebEnv;
	}
	if (typeof window !== "undefined") {
		cachedWebEnv = {
			publicApiOrigin: `${window.location.origin.replace(/:\d+$/, "")}:3000`,
		};
		return cachedWebEnv;
	}
	cachedWebEnv = { publicApiOrigin: "" };
	return cachedWebEnv;
}

export function getWebEnv(): WebEnv {
	if (!cachedWebEnv) {
		return initWebEnv();
	}
	return cachedWebEnv;
}
