import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../core/prisma/prisma.service";

/**
 * Liveness and readiness endpoints for orchestrators and load balancers.
 */
@ApiTags("Health")
@Controller("health")
export class HealthController {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	/** Process is running. */
	@Public()
	@Get("live")
	@ApiOperation({ summary: "Liveness probe" })
	liveness(): { status: string } {
		return { status: "ok" };
	}

	/** Database connectivity check. */
	@Public()
	@Get("ready")
	@ApiOperation({ summary: "Readiness probe (database)" })
	async readiness(): Promise<{ status: string }> {
		await this.prisma.$queryRaw`SELECT 1`;
		return { status: "ok" };
	}
}
