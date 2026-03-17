import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

interface CreateAlertRuleDto {
	endpointId: string;
	channelId: string;
	condition: string;
}

@Injectable()
export class AlertRulesService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateAlertRuleDto) {
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

	async findByEndpoint(endpointId: string, userId: string) {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) throw new ForbiddenException("Access denied");

		return this.prisma.alertRule.findMany({
			where: { endpointId },
			include: { channel: true },
		});
	}

	async remove(id: string, userId: string) {
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
