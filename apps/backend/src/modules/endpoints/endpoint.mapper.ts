import type { EndpointDto } from "@proxy-server/shared";
import type { Endpoint } from "@prisma/generated/client";

/** Strips internal fields and normalizes dates for API responses. */
export function mapEndpointToDto(endpoint: Endpoint): EndpointDto {
	return {
		id: endpoint.id,
		name: endpoint.name,
		slug: endpoint.slug,
		targetUrl: endpoint.targetUrl,
		isActive: endpoint.isActive,
		createdAt: endpoint.createdAt.toISOString(),
	};
}
