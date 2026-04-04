import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Query,
} from "@nestjs/common";
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
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { LogsListQueryDto } from "./dto/logs-list-query.dto";
import { LogsService } from "./logs.service";

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
		@Query() query: LogsListQueryDto,
	): ReturnType<LogsService["findByEndpoint"]> {
		return this.logsService.findByEndpoint(endpointId, user.id, query);
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
	): ReturnType<LogsService["findOne"]> {
		return this.logsService.findOne(id, user.id);
	}

	@Post(":id/replay")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Replay a logged request",
		description:
			"Re-issues the stored request to the endpoint target and appends a new log entry.",
	})
	@ApiParam({ name: "id", description: "Original log UUID", format: "uuid" })
	@ApiOkResponse({
		description: "Replay result with new log id and upstream response snapshot",
	})
	replay(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
	): ReturnType<LogsService["replay"]> {
		return this.logsService.replay(id, user.id);
	}
}
