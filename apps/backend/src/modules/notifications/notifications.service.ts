import { Inject, Injectable } from "@nestjs/common";
import type { NotificationChannel, RequestLog } from "@prisma/generated/client";
import { PrismaService } from "../../core/prisma/prisma.service";
import { SlackService } from "./slack.service";
import { TelegramService } from "./telegram.service";

const THROTTLE_MS = 5 * 60 * 1000;
const throttleMap = new Map<string, number>();

function throttleKey(endpointId: string, channelId: string): string {
	return `${endpointId}:${channelId}`;
}

function shouldThrottle(endpointId: string, channelId: string): boolean {
	const key = throttleKey(endpointId, channelId);
	const last = throttleMap.get(key);
	if (!last) return false;
	return Date.now() - last < THROTTLE_MS;
}

function markThrottle(endpointId: string, channelId: string) {
	throttleMap.set(throttleKey(endpointId, channelId), Date.now());
}

@Injectable()
export class NotificationsService {
	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(TelegramService) private readonly telegram: TelegramService,
		@Inject(SlackService) private readonly slack: SlackService,
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
			if (shouldThrottle(endpointId, rule.channelId)) continue;

			const matches = this.evaluateCondition(rule.condition, log);
			if (!matches) continue;

			const message = this.formatAlert(log, rule.condition);
			await this.sendToChannel(rule.channel, message).catch((err) =>
				console.error("Notification failed:", err),
			);
			markThrottle(endpointId, rule.channelId);
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
		const config = channel.config as Record<string, string>;
		if (channel.type === "TELEGRAM") {
			await this.telegram.send(
				{ botToken: config.botToken!, chatId: config.chatId! },
				message,
			);
		} else if (channel.type === "SLACK") {
			await this.slack.send({ webhookUrl: config.webhookUrl! }, message);
		}
	}
}
