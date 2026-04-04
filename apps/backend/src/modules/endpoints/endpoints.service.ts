import type {
	EndpointDto,
	EndpointListResponseDto,
} from "@proxy-server/shared";
import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import type { CreateEndpointDto } from "./dto/create-endpoint.dto";
import type { ListEndpointsQueryDto } from "./dto/list-endpoints-query.dto";
import type { UpdateEndpointDto } from "./dto/update-endpoint.dto";
import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	type Endpoint,
	EndpointProtocol,
	Prisma,
} from "@prisma/generated/client";
import { customAlphabet } from "nanoid";
import { paginationConstants } from "../../common/constants/pagination.constants";
import { PrismaService } from "../../core/prisma/prisma.service";
import { mapEndpointToDto } from "./endpoint.mapper";

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 10;
const SLUG_MAX_ATTEMPTS = 5;
const generateSlug = customAlphabet(slugAlphabet, SLUG_LENGTH);

@Injectable()
export class EndpointsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateEndpointDto): Promise<EndpointDto> {
		let slug = generateSlug();
		let attempts = 0;
		while (attempts < SLUG_MAX_ATTEMPTS) {
			const existing = await this.prisma.endpoint.findUnique({
				where: { slug },
			});
			if (!existing) break;
			slug = generateSlug();
			attempts++;
		}
		const protocol = toEndpointProtocol(dto.protocol);
		const created = await this.prisma.endpoint.create({
			data: {
				userId,
				name: dto.name,
				slug,
				targetUrl: dto.targetUrl,
				protocol,
				...(dto.rateLimitConfig != null && {
					rateLimitConfig: toJsonValue(dto.rateLimitConfig),
				}),
				...(dto.transformRules != null && {
					transformRules: toJsonValue(dto.transformRules),
				}),
				...(dto.tcpProxyPort != null && { tcpProxyPort: dto.tcpProxyPort }),
				isActive: dto.isActive ?? true,
			},
		});
		return mapEndpointToDto(created);
	}

	async findAll(
		userId: string,
		query: ListEndpointsQueryDto,
	): Promise<EndpointListResponseDto> {
		const offset = query.offset ?? paginationConstants.DEFAULT_OFFSET;
		const limit = Math.min(
			query.limit ?? paginationConstants.DEFAULT_LIST_LIMIT,
			paginationConstants.MAX_LIST_LIMIT,
		);
		const where = { userId };
		const [items, total] = await Promise.all([
			this.prisma.endpoint.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			this.prisma.endpoint.count({ where }),
		]);
		return {
			items: items.map(mapEndpointToDto),
			total,
			limit,
			offset,
		};
	}

	private async getOwnedEndpointOrThrow(
		id: string,
		user: CurrentUserPayload,
	): Promise<Endpoint> {
		const endpoint = await this.prisma.endpoint.findUnique({
			where: { id },
		});
		if (!endpoint) {
			throw new NotFoundException("Endpoint not found");
		}
		if (endpoint.userId !== user.id) {
			throw new ForbiddenException("Access denied");
		}
		return endpoint;
	}

	async findOne(id: string, user: CurrentUserPayload): Promise<EndpointDto> {
		const endpoint = await this.getOwnedEndpointOrThrow(id, user);
		return mapEndpointToDto(endpoint);
	}

	async findBySlug(slug: string): Promise<Endpoint | null> {
		return this.prisma.endpoint.findUnique({
			where: { slug, isActive: true },
		});
	}

	async update(
		id: string,
		user: CurrentUserPayload,
		dto: UpdateEndpointDto,
	): Promise<EndpointDto> {
		await this.getOwnedEndpointOrThrow(id, user);
		const updated = await this.prisma.endpoint.update({
			where: { id },
			data: {
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl }),
				...(dto.protocol !== undefined && {
					protocol: toEndpointProtocol(dto.protocol),
				}),
				...(dto.rateLimitConfig !== undefined && {
					rateLimitConfig:
						dto.rateLimitConfig === null
							? Prisma.DbNull
							: toJsonValue(dto.rateLimitConfig),
				}),
				...(dto.transformRules !== undefined && {
					transformRules:
						dto.transformRules === null
							? Prisma.DbNull
							: toJsonValue(dto.transformRules),
				}),
				...(dto.tcpProxyPort !== undefined && {
					tcpProxyPort: dto.tcpProxyPort === null ? null : dto.tcpProxyPort,
				}),
				...(dto.isActive !== undefined && { isActive: dto.isActive }),
			},
		});
		return mapEndpointToDto(updated);
	}

	async remove(
		id: string,
		user: CurrentUserPayload,
	): Promise<{ success: boolean }> {
		await this.getOwnedEndpointOrThrow(id, user);
		await this.prisma.endpoint.delete({
			where: { id },
		});
		return { success: true };
	}
}

function toEndpointProtocol(value: string | undefined): EndpointProtocol {
	if (value === undefined) return EndpointProtocol.HTTP;
	const allowed = Object.values(EndpointProtocol) as string[];
	if (allowed.includes(value)) return value as EndpointProtocol;
	return EndpointProtocol.HTTP;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
	return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
