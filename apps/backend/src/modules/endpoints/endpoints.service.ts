import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { customAlphabet } from "nanoid";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../core/prisma/prisma.service";
import type { CreateEndpointDto } from "./dto/create-endpoint.dto";
import type { UpdateEndpointDto } from "./dto/update-endpoint.dto";

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const generateSlug = customAlphabet(slugAlphabet, 10);

@Injectable()
export class EndpointsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateEndpointDto) {
		let slug = generateSlug();
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts) {
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

	async findAll(userId: string) {
		return this.prisma.endpoint.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async findOne(id: string, user: CurrentUserPayload) {
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

	async findBySlug(slug: string) {
		return this.prisma.endpoint.findUnique({
			where: { slug, isActive: true },
		});
	}

	async update(id: string, user: CurrentUserPayload, dto: UpdateEndpointDto) {
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

	async remove(id: string, user: CurrentUserPayload) {
		await this.findOne(id, user);
		await this.prisma.endpoint.delete({
			where: { id },
		});
		return { success: true };
	}
}
