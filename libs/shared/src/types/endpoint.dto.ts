import type { EndpointProtocol } from "./endpoint-protocol.type";
import type { RateLimitConfig } from "./rate-limit-config.type";
import type { TransformRule } from "./transform-rule.type";

export type EndpointDto = {
	id: string;
	name: string;
	slug: string;
	targetUrl: string;
	protocol: EndpointProtocol;
	rateLimitConfig: RateLimitConfig | null;
	transformRules: TransformRule[] | null;
	isActive: boolean;
	createdAt: string;
};

export type EndpointListResponseDto = {
	items: EndpointDto[];
	total: number;
	limit: number;
	offset: number;
};
