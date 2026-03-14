import { Module } from '@nestjs/common';
import { AlertRulesService } from './alert-rules.service';
import { NotificationChannelsService } from './notification-channels.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SlackService } from './slack.service';
import { TelegramService } from './telegram.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationChannelsService,
    AlertRulesService,
    TelegramService,
    SlackService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
