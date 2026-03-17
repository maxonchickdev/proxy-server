import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class LogsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async findByEndpoint(
		endpointId: string,
		userId: string,
		options: {
			limit: number;
			offset: number;
			method?: string;
			status?: number;
		},
	) {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) {
			throw new ForbiddenException("Access denied");
		}

		const where: Record<string, unknown> = { endpointId };
		if (options.method) where.method = options.method;
		if (options.status != null) where.responseStatus = options.status;

		const [logs, total] = await Promise.all([
			this.prisma.requestLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: Math.min(options.limit, 100),
				skip: options.offset,
			}),
			this.prisma.requestLog.count({ where }),
		]);

		return { logs, total };
	}

	async findOne(logId: string, userId: string) {
		const log = await this.prisma.requestLog.findUnique({
			where: { id: logId },
			include: { endpoint: true },
		});
		if (!log) {
			throw new NotFoundException("Log not found");
		}
		if (log.endpoint.userId !== userId) {
			throw new ForbiddenException("Access denied");
		}
		return log;
	}
}
