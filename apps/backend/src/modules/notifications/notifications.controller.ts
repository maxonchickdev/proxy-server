import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Post,
	UseGuards,
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AlertRulesService } from "./alert-rules.service";
import type { CreateAlertRuleDto } from "./dto/create-alert-rule.dto.js";
import type { CreateChannelDto } from "./dto/create-channel.dto.js";
import { NotificationChannelsService } from "./notification-channels.service";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

@ApiTags("Notifications")
@ApiBearerAuth("Bearer")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(
		@Inject(NotificationChannelsService)
		private readonly channels: NotificationChannelsService,
		@Inject(AlertRulesService) private readonly alertRules: AlertRulesService,
	) {}

	@Post("channels")
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
	) {
		return this.channels.create(userId, dto);
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
	listChannels(@CurrentUser("id") userId: string) {
		return this.channels.findAll(userId);
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
	deleteChannel(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.channels.remove(id, userId);
	}

	@Post("alert-rules")
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
	) {
		return this.alertRules.create(userId, dto);
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
	) {
		return this.alertRules.findByEndpoint(endpointId, userId);
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
	deleteAlertRule(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.alertRules.remove(id, userId);
	}
}
