/** API representation of a proxy endpoint (safe fields only). */
export type EndpointDto = {
	id: string;
	name: string;
	slug: string;
	targetUrl: string;
	isActive: boolean;
	createdAt: string;
};

/** Paginated list of endpoints returned by `GET /endpoints`. */
export type EndpointListResponseDto = {
	items: EndpointDto[];
	total: number;
	limit: number;
	offset: number;
};
