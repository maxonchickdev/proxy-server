import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type { Endpoint } from "@prisma/generated/client";
import { customAlphabet } from "nanoid";
import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import { PrismaService } from "../../core/prisma/prisma.service";
import { paginationConstants } from "../../common/constants/pagination.constants";
import type { CreateEndpointDto } from "./dto/create-endpoint.dto";
import type { ListEndpointsQueryDto } from "./dto/list-endpoints-query.dto";
import type { UpdateEndpointDto } from "./dto/update-endpoint.dto";

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 10;
const SLUG_MAX_ATTEMPTS = 5;
const generateSlug = customAlphabet(slugAlphabet, SLUG_LENGTH);

/** Domain logic and persistence for proxy endpoint records. */
@Injectable()
export class EndpointsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateEndpointDto): Promise<Endpoint> {
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

		return this.prisma.endpoint.create({
			data: {
				userId,
				name: dto.name,
				slug,
				targetUrl: dto.targetUrl,
				isActive: dto.isActive ?? true,
			},
		});
	}

	async findAll(
		userId: string,
		query: ListEndpointsQueryDto,
	): Promise<{
		items: Endpoint[];
		total: number;
		limit: number;
		offset: number;
	}> {
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
		return { items, total, limit, offset };
	}

	async findOne(id: string, user: CurrentUserPayload): Promise<Endpoint> {
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

	async findBySlug(slug: string): Promise<Endpoint | null> {
		return this.prisma.endpoint.findUnique({
			where: { slug, isActive: true },
		});
	}

	async update(
		id: string,
		user: CurrentUserPayload,
		dto: UpdateEndpointDto,
	): Promise<Endpoint> {
		await this.findOne(id, user);
		return this.prisma.endpoint.update({
			where: { id },
			data: {
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl }),
				...(dto.isActive !== undefined && { isActive: dto.isActive }),
			},
		});
	}

	async remove(
		id: string,
		user: CurrentUserPayload,
	): Promise<{ success: boolean }> {
		await this.findOne(id, user);
		await this.prisma.endpoint.delete({
			where: { id },
		});
		return { success: true };
	}
}
