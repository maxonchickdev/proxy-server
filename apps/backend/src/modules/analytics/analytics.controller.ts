import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiTooManyRequestsResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ErrorResponseSchema } from "../../common/swagger/schemas/error-response.schema";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsTimeseriesQueryDto } from "./dto/analytics-timeseries-query.dto";

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
		@Query() query: AnalyticsTimeseriesQueryDto,
	): ReturnType<AnalyticsService["getTimeseries"]> {
		return this.analyticsService.getTimeseries(endpointId, userId, {
			bucket: query.bucket ?? "hour",
			limit: query.limit,
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
