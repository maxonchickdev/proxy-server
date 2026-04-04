import type { CreateReportScheduleDto } from "./dto/create-report-schedule.dto";
import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class ReportSchedulesService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateReportScheduleDto) {
		const channel = await this.prisma.notificationChannel.findUnique({
			where: { id: dto.channelId },
		});
		if (!channel || channel.userId !== userId) {
			throw new ForbiddenException("Invalid channel");
		}
		return this.prisma.reportSchedule.create({
			data: {
				userId,
				channelId: dto.channelId,
				frequency: dto.frequency,
			},
		});
	}

	async list(userId: string) {
		return this.prisma.reportSchedule.findMany({
			where: { userId, isActive: true },
			orderBy: { createdAt: "desc" },
		});
	}

	async remove(id: string, userId: string): Promise<{ success: boolean }> {
		const row = await this.prisma.reportSchedule.findUnique({ where: { id } });
		if (!row || row.userId !== userId) {
			throw new NotFoundException("Schedule not found");
		}
		await this.prisma.reportSchedule.delete({ where: { id } });
		return { success: true };
	}
}
