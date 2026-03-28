import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { NotificationChannel } from "@prisma/generated/client";
import { paginationConstants } from "../../common/constants/pagination.constants";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { PrismaService } from "../../core/prisma/prisma.service";
import type { CreateChannelDto } from "./dto/create-channel.dto";

/**
 * Persistence for user-owned notification channels (Telegram, Slack, etc.).
 */
@Injectable()
export class NotificationChannelsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(
		userId: string,
		dto: CreateChannelDto,
	): Promise<NotificationChannel> {
		return this.prisma.notificationChannel.create({
			data: {
				userId,
				type: dto.type,
				config: dto.config as object,
			},
		});
	}

	async findAll(
		userId: string,
		query: PaginationQueryDto,
	): Promise<{
		items: NotificationChannel[];
		total: number;
		limit: number;
		offset: number;
	}> {
		const offset = query.offset ?? paginationConstants.DEFAULT_OFFSET;
		const limit = Math.min(
			query.limit ?? paginationConstants.DEFAULT_LIST_LIMIT,
			paginationConstants.MAX_LIST_LIMIT,
		);
		const where = { userId, isActive: true };
		const [items, total] = await Promise.all([
			this.prisma.notificationChannel.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			this.prisma.notificationChannel.count({ where }),
		]);
		return { items, total, limit, offset };
	}

	async findOne(id: string, userId: string): Promise<NotificationChannel> {
		const ch = await this.prisma.notificationChannel.findUnique({
			where: { id },
		});
		if (!ch || ch.userId !== userId) {
			throw new NotFoundException("Channel not found");
		}
		return ch;
	}

	async remove(id: string, userId: string): Promise<{ success: boolean }> {
		await this.findOne(id, userId);
		await this.prisma.notificationChannel.update({
			where: { id },
			data: { isActive: false },
		});
		return { success: true };
	}
}
