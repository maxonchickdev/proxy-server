import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AlertRulesService } from "./alert-rules.service";
import { AlertThrottleService } from "./alert-throttle.service";
import { NotificationChannelsService } from "./notification-channels.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { SlackService } from "./slack.service";
import { TelegramService } from "./telegram.service";

/**
 * Notifications, channels, and alert rules feature module.
 */
@Module({
	imports: [ConfigModule],
	controllers: [NotificationsController],
	providers: [
		NotificationsService,
		NotificationChannelsService,
		AlertRulesService,
		AlertThrottleService,
		TelegramService,
		SlackService,
	],
	exports: [NotificationsService],
})
export class NotificationsModule {}
