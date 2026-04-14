import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../core/prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { AlertRulesService } from "./alert-rules.service";
import { AlertThrottleService } from "./alert-throttle.service";
import { NotificationChannelsService } from "./notification-channels.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { ReportSchedulesService } from "./report-schedules.service";
import { ReportsService } from "./reports.service";
import { SlackService } from "./slack.service";
import { TelegramService } from "./telegram.service";

@Module({
	imports: [ConfigModule, EmailModule, PrismaModule],
	controllers: [NotificationsController],
	providers: [
		NotificationsService,
		NotificationChannelsService,
		AlertRulesService,
		AlertThrottleService,
		ReportSchedulesService,
		ReportsService,
		TelegramService,
		SlackService,
	],
	exports: [NotificationsService, AlertThrottleService],
})
export class NotificationsModule {}
