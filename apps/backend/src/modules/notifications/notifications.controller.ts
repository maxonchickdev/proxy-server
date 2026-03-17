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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AlertRulesService } from "./alert-rules.service";
import {
	type CreateChannelDto,
	NotificationChannelsService,
} from "./notification-channels.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(
		@Inject(NotificationChannelsService)
		private readonly channels: NotificationChannelsService,
		@Inject(AlertRulesService) private readonly alertRules: AlertRulesService,
	) {}

	@Post("channels")
	createChannel(
		@CurrentUser("id") userId: string,
		@Body() dto: CreateChannelDto,
	) {
		return this.channels.create(userId, dto);
	}

	@Get("channels")
	listChannels(@CurrentUser("id") userId: string) {
		return this.channels.findAll(userId);
	}

	@Delete("channels/:id")
	deleteChannel(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.channels.remove(id, userId);
	}

	@Post("alert-rules")
	createAlertRule(
		@CurrentUser("id") userId: string,
		@Body() dto: { endpointId: string; channelId: string; condition: string },
	) {
		return this.alertRules.create(userId, dto);
	}

	@Get("alert-rules/endpoint/:endpointId")
	getAlertRules(
		@Param("endpointId") endpointId: string,
		@CurrentUser("id") userId: string,
	) {
		return this.alertRules.findByEndpoint(endpointId, userId);
	}

	@Delete("alert-rules/:id")
	deleteAlertRule(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.alertRules.remove(id, userId);
	}
}
