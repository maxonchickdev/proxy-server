import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type { AlertRule, Prisma } from "@prisma/generated/client";
import { paginationConstants } from "../../common/constants/pagination.constants";
import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { PrismaService } from "../../core/prisma/prisma.service";
import { CreateAlertRuleDto } from "./dto/create-alert-rule.dto";

type AlertRuleWithChannel = Prisma.AlertRuleGetPayload<{
	include: { channel: true };
}>;

/**
 * Manages alert rules linking endpoints to notification channels.
 */
@Injectable()
export class AlertRulesService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateAlertRuleDto): Promise<AlertRule> {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: dto.endpointId, userId },
		});
		if (!endpoint) throw new ForbiddenException("Access denied");
		const channel = await this.prisma.notificationChannel.findFirst({
			where: { id: dto.channelId, userId },
		});
		if (!channel) throw new ForbiddenException("Channel not found");
		return this.prisma.alertRule.create({
			data: {
				endpointId: dto.endpointId,
				userId,
				channelId: dto.channelId,
				condition: dto.condition,
			},
		});
	}

	async findByEndpoint(
		endpointId: string,
		userId: string,
		query: PaginationQueryDto,
	): Promise<{
		items: AlertRuleWithChannel[];
		total: number;
		limit: number;
		offset: number;
	}> {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) throw new ForbiddenException("Access denied");
		const offset = query.offset ?? paginationConstants.DEFAULT_OFFSET;
		const limit = Math.min(
			query.limit ?? paginationConstants.DEFAULT_LIST_LIMIT,
			paginationConstants.MAX_LIST_LIMIT,
		);
		const where = { endpointId };
		const [items, total] = await Promise.all([
			this.prisma.alertRule.findMany({
				where,
				include: { channel: true },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			this.prisma.alertRule.count({ where }),
		]);
		return { items, total, limit, offset };
	}

	async remove(id: string, userId: string): Promise<{ success: boolean }> {
		const rule = await this.prisma.alertRule.findUnique({
			where: { id },
		});
		if (!rule || rule.userId !== userId) {
			throw new NotFoundException("Alert rule not found");
		}
		await this.prisma.alertRule.delete({ where: { id } });
		return { success: true };
	}
}
