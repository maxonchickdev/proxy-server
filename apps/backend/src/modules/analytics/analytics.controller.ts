import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
	ApiTooManyRequestsResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AnalyticsService } from "./analytics.service";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

/**
 * Read-only analytics routes for per-endpoint dashboards.
 */
@ApiTags("Analytics")
@ApiBearerAuth("Bearer")
@Controller("analytics")
export class AnalyticsController {
	constructor(
		@Inject(AnalyticsService)
		private readonly analyticsService: AnalyticsService,
	) {}

	@Get(":endpointId/summary")
	@ApiOperation({
		summary: "Get analytics summary",
		description:
			"Returns aggregated analytics for an endpoint (status counts, latency, etc.).",
	})
	@ApiParam({
		name: "endpointId",
		description: "Endpoint UUID",
		format: "uuid",
	})
	@ApiOkResponse({ description: "Analytics summary" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	getSummary(
		@Param("endpointId") endpointId: string,
		@CurrentUser("id") userId: string,
	): ReturnType<AnalyticsService["getSummary"]> {
		return this.analyticsService.getSummary(endpointId, userId);
	}

	@Get(":endpointId/timeseries")
	@ApiOperation({
		summary: "Get timeseries data",
		description: "Returns time-bucketed analytics for charts.",
	})
	@ApiParam({
		name: "endpointId",
		description: "Endpoint UUID",
		format: "uuid",
	})
	@ApiQuery({ name: "bucket", enum: ["hour", "day"], required: false })
	@ApiQuery({ name: "limit", required: false, description: "Max data points" })
	@ApiOkResponse({ description: "Timeseries data" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	getTimeseries(
		@Param("endpointId") endpointId: string,
		@CurrentUser("id") userId: string,
		@Query("bucket") bucket?: "hour" | "day",
		@Query("limit") limit?: string,
	): ReturnType<AnalyticsService["getTimeseries"]> {
		return this.analyticsService.getTimeseries(endpointId, userId, {
			bucket: bucket ?? "hour",
			limit: limit ? parseInt(limit, 10) : undefined,
		});
	}

	@Get(":endpointId/breakdown")
	@ApiOperation({
		summary: "Get breakdown by status/method",
		description:
			"Returns analytics broken down by status code and HTTP method.",
	})
	@ApiParam({
		name: "endpointId",
		description: "Endpoint UUID",
		format: "uuid",
	})
	@ApiOkResponse({ description: "Breakdown data" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	getBreakdown(
		@Param("endpointId") endpointId: string,
		@CurrentUser("id") userId: string,
	): ReturnType<AnalyticsService["getBreakdown"]> {
		return this.analyticsService.getBreakdown(endpointId, userId);
	}
}
