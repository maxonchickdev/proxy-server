import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { analyticsConstants } from "../analytics.constants";

/**
 * Query parameters for `GET /analytics/:endpointId/timeseries`.
 */
export class AnalyticsTimeseriesQueryDto {
	@ApiPropertyOptional({
		enum: ["hour", "day"],
		description: "Time bucket size",
		default: "hour",
	})
	@IsOptional()
	@IsEnum(["hour", "day"])
	bucket?: "hour" | "day";

	@ApiPropertyOptional({
		description: "Max data points",
		minimum: 1,
		maximum: analyticsConstants.MAX_TIMESERIES_LIMIT,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(analyticsConstants.MAX_TIMESERIES_LIMIT)
	limit?: number;
}
