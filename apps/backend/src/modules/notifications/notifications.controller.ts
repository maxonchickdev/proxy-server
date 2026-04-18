import type { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import type { CreateAlertRuleDto } from "./dto/create-alert-rule.dto";
import type { CreateChannelDto } from "./dto/create-channel.dto";
import type { CreateReportScheduleDto } from "./dto/create-report-schedule.dto";
import {
	Body,
	Controller,
	Delete,
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
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiTooManyRequestsResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ErrorResponseSchema } from "../../common/swagger/schemas/error-response.schema";
import { AlertRulesService } from "./alert-rules.service";
import { NotificationChannelsService } from "./notification-channels.service";
import { ReportSchedulesService } from "./report-schedules.service";

@ApiTags("Notifications")
@ApiBearerAuth("Bearer")
@Controller("notifications")
export class NotificationsController {
	constructor(
		@Inject(NotificationChannelsService)
		private readonly notificationChannelsService: NotificationChannelsService,
		@Inject(AlertRulesService)
		private readonly alertRulesService: AlertRulesService,
		@Inject(ReportSchedulesService)
		private readonly reportSchedulesService: ReportSchedulesService,
	) {}

	@Post("channels")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Create notification channel",
		description: "Creates a Telegram or Slack notification channel.",
	})
	@ApiCreatedResponse({ description: "Channel created successfully" })
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
	createChannel(
		@CurrentUser("id") userId: string,
		@Body() dto: CreateChannelDto,
	): ReturnType<NotificationChannelsService["create"]> {
		return this.notificationChannelsService.create(userId, dto);
	}

	@Get("channels")
	@ApiOperation({
		summary: "List notification channels",
		description: "Returns all active notification channels for the user.",
	})
	@ApiOkResponse({ description: "List of channels" })
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
	listChannels(
		@CurrentUser("id") userId: string,
		@Query() query: PaginationQueryDto,
	): ReturnType<NotificationChannelsService["findAll"]> {
		return this.notificationChannelsService.findAll(userId, query);
	}

	@Delete("channels/:id")
	@ApiOperation({
		summary: "Delete notification channel",
		description:
			"Soft-deletes a notification channel (sets isActive to false).",
	})
	@ApiParam({ name: "id", description: "Channel UUID", format: "uuid" })
	@ApiOkResponse({ description: "Channel deleted successfully" })
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
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	deleteChannel(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
	): ReturnType<NotificationChannelsService["remove"]> {
		return this.notificationChannelsService.remove(id, userId);
	}

	@Post("alert-rules")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Create alert rule",
		description:
			"Creates an alert rule linking an endpoint to a notification channel.",
	})
	@ApiCreatedResponse({ description: "Alert rule created successfully" })
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
	createAlertRule(
		@CurrentUser("id") userId: string,
		@Body() dto: CreateAlertRuleDto,
	): ReturnType<AlertRulesService["create"]> {
		return this.alertRulesService.create(userId, dto);
	}

	@Get("alert-rules/endpoint/:endpointId")
	@ApiOperation({
		summary: "List alert rules for endpoint",
		description: "Returns all alert rules for a given endpoint.",
	})
	@ApiParam({
		name: "endpointId",
		description: "Endpoint UUID",
		format: "uuid",
	})
	@ApiOkResponse({ description: "List of alert rules" })
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
	getAlertRules(
		@Param("endpointId") endpointId: string,
		@CurrentUser("id") userId: string,
		@Query() query: PaginationQueryDto,
	): ReturnType<AlertRulesService["findByEndpoint"]> {
		return this.alertRulesService.findByEndpoint(endpointId, userId, query);
	}

	@Delete("alert-rules/:id")
	@ApiOperation({
		summary: "Delete alert rule",
		description: "Permanently deletes an alert rule.",
	})
	@ApiParam({ name: "id", description: "Alert rule UUID", format: "uuid" })
	@ApiOkResponse({ description: "Alert rule deleted successfully" })
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
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	deleteAlertRule(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
	): ReturnType<AlertRulesService["remove"]> {
		return this.alertRulesService.remove(id, userId);
	}

	@Post("report-schedules")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: "Create digest schedule" })
	createReportSchedule(
		@CurrentUser("id") userId: string,
		@Body() dto: CreateReportScheduleDto,
	): ReturnType<ReportSchedulesService["create"]> {
		return this.reportSchedulesService.create(userId, dto);
	}

	@Get("report-schedules")
	@ApiOperation({ summary: "List digest schedules" })
	listReportSchedules(
		@CurrentUser("id") userId: string,
	): ReturnType<ReportSchedulesService["list"]> {
		return this.reportSchedulesService.list(userId);
	}

	@Delete("report-schedules/:id")
	@ApiOperation({ summary: "Delete digest schedule" })
	deleteReportSchedule(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
	): ReturnType<ReportSchedulesService["remove"]> {
		return this.reportSchedulesService.remove(id, userId);
	}
}
