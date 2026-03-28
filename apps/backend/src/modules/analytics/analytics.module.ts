import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

/**
 * Analytics aggregation feature module.
 */
@Module({
	controllers: [AnalyticsController],
	providers: [AnalyticsService],
})
export class AnalyticsModule {}
