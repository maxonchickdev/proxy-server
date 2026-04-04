import type { Endpoint } from "@prisma/generated/client";
import type { TransformRule } from "@proxy-server/shared";
import type { HeadersRecord } from "./proxy-context.type.js";
import { Injectable } from "@nestjs/common";

type RequestPhaseResult = {
	path: string;
	headers: Record<string, string>;
	requestBody: Buffer | null;
};

type ResponsePhaseInput = {
	status: number;
	headers: Record<string, string>;
	body: Buffer;
};

@Injectable()
export class TransformPipelineService {
	parseRules(endpoint: Endpoint): TransformRule[] {
		const raw = endpoint.transformRules;
		if (raw === null) return [];
		if (!Array.isArray(raw)) return [];
		return raw as TransformRule[];
	}

	applyRequestPhase(
		endpoint: Endpoint,
		path: string,
		headers: Record<string, string>,
		requestBody: Buffer | null,
		method: string,
	): RequestPhaseResult {
		const rules = this.parseRules(endpoint);
		let nextPath = path;
		const nextHeaders = { ...headers };
		let nextBody = requestBody;
		for (const rule of rules) {
			if (rule.type === "REWRITE_PATH") {
				try {
					const re = new RegExp(rule.pattern, "g");
					nextPath = nextPath.replace(re, rule.replacement);
				} catch {
					// invalid regex — skip rule
				}
			} else if (rule.type === "ADD_HEADER" && rule.phase === "request") {
				nextHeaders[rule.name] = rule.value;
			} else if (rule.type === "REMOVE_HEADER" && rule.phase === "request") {
				delete nextHeaders[rule.name];
				delete nextHeaders[rule.name.toLowerCase()];
			} else if (
				rule.type === "SET_BODY" &&
				rule.phase === "request" &&
				!["GET", "HEAD"].includes(method.toUpperCase())
			) {
				nextBody = Buffer.from(rule.template, "utf8");
			}
		}
		return { path: nextPath, headers: nextHeaders, requestBody: nextBody };
	}

	applyStreamingResponseHeaders(
		endpoint: Endpoint,
		headers: Record<string, string>,
	): Record<string, string> {
		const rules = this.parseRules(endpoint);
		const next = { ...headers };
		for (const rule of rules) {
			if (rule.type === "ADD_HEADER" && rule.phase === "response") {
				next[rule.name] = rule.value;
			} else if (rule.type === "REMOVE_HEADER" && rule.phase === "response") {
				delete next[rule.name];
				const lower = rule.name.toLowerCase();
				for (const key of Object.keys(next)) {
					if (key.toLowerCase() === lower) delete next[key];
				}
			}
		}
		return next;
	}

	applyResponsePhase(
		endpoint: Endpoint,
		input: ResponsePhaseInput,
	): ResponsePhaseInput {
		const rules = this.parseRules(endpoint);
		const headers = { ...input.headers };
		let body = input.body;
		for (const rule of rules) {
			if (rule.type === "ADD_HEADER" && rule.phase === "response") {
				headers[rule.name] = rule.value;
			} else if (rule.type === "REMOVE_HEADER" && rule.phase === "response") {
				delete headers[rule.name];
				const lower = rule.name.toLowerCase();
				for (const key of Object.keys(headers)) {
					if (key.toLowerCase() === lower) delete headers[key];
				}
			} else if (rule.type === "SET_BODY" && rule.phase === "response") {
				body = Buffer.from(rule.template, "utf8");
			}
		}
		return { status: input.status, headers, body };
	}

	flattenHeaders(headers: HeadersRecord): Record<string, string> {
		const out: Record<string, string> = {};
		for (const [key, value] of Object.entries(headers)) {
			if (value === undefined) continue;
			out[key] = Array.isArray(value) ? value.join(", ") : value;
		}
		return out;
	}
}
