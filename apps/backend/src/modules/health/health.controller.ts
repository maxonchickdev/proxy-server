import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService } from "./health.service";

/**
 * Liveness and readiness endpoints for orchestrators and load balancers.
 */
@SkipThrottle()
@ApiTags("Health")
@Controller("health")
export class HealthController {
	constructor(@Inject(HealthService) private readonly health: HealthService) {}

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
		await this.health.assertDatabaseReady();
		return { status: "ok" };
	}
}
