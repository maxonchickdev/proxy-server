import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { paginationConstants } from "../../common/constants/pagination.constants";
import { PrismaService } from "../../core/prisma/prisma.service";
import type { Endpoint, RequestLog } from "@prisma/generated/client";
import type { LogsListQueryDto } from "./dto/logs-list-query.dto";

/**
 * Read access to persisted proxy request logs.
 */
@Injectable()
export class LogsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	/** Lists logs for an endpoint the user owns with optional filters. */
	async findByEndpoint(
		endpointId: string,
		userId: string,
		query: LogsListQueryDto,
	): Promise<{ logs: RequestLog[]; total: number }> {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) {
			throw new ForbiddenException("Access denied");
		}
		const limit =
			query.limit ??
			Math.min(
				paginationConstants.DEFAULT_LIST_LIMIT,
				paginationConstants.MAX_LIST_LIMIT,
			);
		const offset = query.offset ?? paginationConstants.DEFAULT_OFFSET;
		const where: Record<string, unknown> = { endpointId };
		if (query.method) where.method = query.method;
		if (query.status != null) where.responseStatus = query.status;
		const [logs, total] = await Promise.all([
			this.prisma.requestLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: Math.min(limit, paginationConstants.MAX_LIST_LIMIT),
				skip: offset,
			}),
			this.prisma.requestLog.count({ where }),
		]);
		return { logs, total };
	}

	/** Loads one log row with endpoint context when the user owns the endpoint. */
	async findOne(
		logId: string,
		userId: string,
	): Promise<
		RequestLog & {
			endpoint: Endpoint;
		}
	> {
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
