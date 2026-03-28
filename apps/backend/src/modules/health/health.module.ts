import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/prisma/prisma.module";
import { HealthController } from "./health.controller";

/**
 * Kubernetes-style liveness/readiness probes.
 */
@Module({
	imports: [PrismaModule],
	controllers: [HealthController],
})
export class HealthModule {}
