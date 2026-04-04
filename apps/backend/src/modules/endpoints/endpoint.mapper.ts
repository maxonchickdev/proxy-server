import type { Endpoint, Prisma } from "@prisma/generated/client";
import type {
	EndpointDto,
	EndpointProtocol,
	RateLimitConfig,
	TransformRule,
} from "@proxy-server/shared";

function parseRateLimit(
	value: Prisma.JsonValue | null,
): RateLimitConfig | null {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	const o = value as Record<string, unknown>;
	const maxRequests = o.maxRequests;
	const windowSeconds = o.windowSeconds;
	if (
		typeof maxRequests === "number" &&
		typeof windowSeconds === "number" &&
		Number.isFinite(maxRequests) &&
		Number.isFinite(windowSeconds)
	) {
		return { maxRequests, windowSeconds };
	}
	return null;
}

function parseTransformRules(
	value: Prisma.JsonValue | null,
): TransformRule[] | null {
	if (value === null) return null;
	if (!Array.isArray(value)) return null;
	return value as TransformRule[];
}

export function mapEndpointToDto(endpoint: Endpoint): EndpointDto {
	return {
		id: endpoint.id,
		name: endpoint.name,
		slug: endpoint.slug,
		targetUrl: endpoint.targetUrl,
		protocol: endpoint.protocol as EndpointProtocol,
		rateLimitConfig: parseRateLimit(endpoint.rateLimitConfig ?? null),
		transformRules: parseTransformRules(endpoint.transformRules ?? null),
		tcpProxyPort: endpoint.tcpProxyPort,
		isActive: endpoint.isActive,
		createdAt: endpoint.createdAt.toISOString(),
	};
}
