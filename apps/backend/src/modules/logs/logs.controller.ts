import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
	ApiTooManyRequestsResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { LogsService } from "./logs.service";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

@ApiTags("Logs")
@ApiBearerAuth("Bearer")
@Controller("logs")
export class LogsController {
	constructor(@Inject(LogsService) private readonly logsService: LogsService) {}

	@Get("endpoint/:endpointId")
	@ApiOperation({
		summary: "List logs by endpoint",
		description:
			"Returns request logs for an endpoint with optional filtering.",
	})
	@ApiParam({
		name: "endpointId",
		description: "Endpoint UUID",
		format: "uuid",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		description: "Max results (default: 50)",
	})
	@ApiQuery({
		name: "offset",
		required: false,
		description: "Pagination offset",
	})
	@ApiQuery({
		name: "method",
		required: false,
		description: "Filter by HTTP method",
	})
	@ApiQuery({
		name: "status",
		required: false,
		description: "Filter by response status",
	})
	@ApiOkResponse({ description: "List of request logs" })
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
	async findByEndpoint(
		@Param("endpointId") endpointId: string,
		@CurrentUser() user: CurrentUserPayload,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
		@Query("method") method?: string,
		@Query("status") status?: string,
	) {
		return this.logsService.findByEndpoint(endpointId, user.id, {
			limit: limit ? parseInt(limit, 10) : 50,
			offset: offset ? parseInt(offset, 10) : 0,
			method: method || undefined,
			status: status ? parseInt(status, 10) : undefined,
		});
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get log by ID",
		description: "Returns a single request log by ID.",
	})
	@ApiParam({ name: "id", description: "Log UUID", format: "uuid" })
	@ApiOkResponse({ description: "Request log details" })
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
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	async findOne(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
	) {
		return this.logsService.findOne(id, user.id);
	}
}
