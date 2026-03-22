import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";
import type { NotificationChannel, RequestLog } from "@prisma/generated/client";
import { PrismaService } from "../../core/prisma/prisma.service";
import { AlertThrottleService } from "./alert-throttle.service";
import { SlackService } from "./slack.service";
import { TelegramService } from "./telegram.service";

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(TelegramService) private readonly telegram: TelegramService,
		@Inject(SlackService) private readonly slack: SlackService,
		@Inject(AlertThrottleService)
		private readonly throttle: AlertThrottleService,
	) {}

	async evaluateAndNotify(
		endpointId: string,
		log: Pick<RequestLog, "responseStatus" | "durationMs" | "method" | "path">,
	) {
		const rules = await this.prisma.alertRule.findMany({
			where: { endpointId, isActive: true },
			include: { channel: true },
		});

		for (const rule of rules) {
			if (!rule.channel.isActive) continue;
			if (await this.throttle.isThrottled(endpointId, rule.channelId)) continue;

			const matches = this.evaluateCondition(rule.condition, log);
			if (!matches) continue;

			const message = this.formatAlert(log, rule.condition);
			await this.sendToChannel(rule.channel, message).catch((err: unknown) =>
				this.logger.error(
					`Notification failed: ${err instanceof Error ? err.message : err}`,
				),
			);
			await this.throttle.markSent(endpointId, rule.channelId);
		}
	}

	private evaluateCondition(
		condition: string,
		log: Pick<RequestLog, "responseStatus" | "durationMs">,
	): boolean {
		const status = log.responseStatus ?? 0;
		const latency = log.durationMs ?? 0;

		if (condition.includes("status") && condition.includes(">=")) {
			const match = condition.match(/status\s*>=\s*(\d+)/i);
			if (match) return status >= parseInt(match[1], 10);
		}
		if (condition.includes("latency") && condition.includes(">")) {
			const match = condition.match(/latency\s*>\s*(\d+)/i);
			if (match) return latency > parseInt(match[1], 10);
		}
		return false;
	}

	private formatAlert(
		log: Pick<RequestLog, "responseStatus" | "durationMs" | "method" | "path">,
		condition: string,
	): string {
		return `[API Alert] ${condition}\nMethod: ${log.method}\nPath: ${log.path}\nStatus: ${log.responseStatus ?? "N/A"}\nLatency: ${log.durationMs ?? "N/A"}ms`;
	}

	private async sendToChannel(
		channel: NotificationChannel,
		message: string,
	): Promise<void> {
		const config = channel.config as Record<string, unknown>;
		if (channel.type === "TELEGRAM") {
			const botToken =
				typeof config.botToken === "string" ? config.botToken : "";
			const chatId = typeof config.chatId === "string" ? config.chatId : "";
			if (!botToken || !chatId) {
				throw new BadRequestException(
					"Telegram channel requires botToken and chatId in config",
				);
			}
			await this.telegram.send({ botToken, chatId }, message);
		} else if (channel.type === "SLACK") {
			const webhookUrl =
				typeof config.webhookUrl === "string" ? config.webhookUrl : "";
			if (!webhookUrl) {
				throw new BadRequestException(
					"Slack channel requires webhookUrl in config",
				);
			}
			await this.slack.send({ webhookUrl }, message);
		}
	}
}
