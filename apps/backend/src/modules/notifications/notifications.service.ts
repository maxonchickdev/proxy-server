import type { NotificationChannel, RequestLog } from "@prisma/generated/client";
import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigKeyEnum } from "../../common/enums/config.enum.js";
import { AppType } from "../../core/config/types/app.type.js";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AlertThrottleService } from "./alert-throttle.service";
import { SlackService } from "./slack.service";
import { TelegramService } from "./telegram.service";

type AlertContext = {
	log: Pick<RequestLog, "responseStatus" | "durationMs" | "method" | "path">;
	condition: string;
	endpointId: string;
	endpointName: string;
	ruleId: string;
	channelId: string;
	dashboardBaseUrl: string;
};

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);
	private readonly dashboardBaseUrl: string;

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(TelegramService) private readonly telegram: TelegramService,
		@Inject(SlackService) private readonly slack: SlackService,
		@Inject(AlertThrottleService)
		private readonly throttle: AlertThrottleService,
		@Inject(ConfigService) readonly configService: ConfigService,
		@Inject(EmailService) private readonly emailService: EmailService,
	) {
		const { dashboardBaseUrl } = configService.getOrThrow<AppType>(
			ConfigKeyEnum.APP,
		);

		this.dashboardBaseUrl = dashboardBaseUrl;
	}

	async evaluateAndNotify(
		endpointId: string,
		log: Pick<RequestLog, "responseStatus" | "durationMs" | "method" | "path">,
	): Promise<void> {
		const endpoint = await this.prisma.endpoint.findUnique({
			where: { id: endpointId },
			select: { name: true },
		});
		const endpointName = endpoint?.name ?? "Endpoint";
		const rules = await this.prisma.alertRule.findMany({
			where: { endpointId, isActive: true },
			include: { channel: true },
		});
		for (const rule of rules) {
			if (!rule.channel.isActive) continue;
			if (await this.throttle.isThrottled(endpointId, rule.channelId)) continue;

			const matches = this.evaluateCondition(rule.condition, log);
			if (!matches) continue;

			const ctx: AlertContext = {
				log,
				condition: rule.condition,
				endpointId,
				endpointName,
				ruleId: rule.id,
				channelId: rule.channelId,
				dashboardBaseUrl: this.dashboardBaseUrl,
			};
			await this.sendToChannel(rule.channel, ctx).catch((err: unknown) =>
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

	private async sendToChannel(
		channel: NotificationChannel,
		ctx: AlertContext,
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
			const text = this.formatTelegramHtml(ctx);
			await this.telegram.send({ botToken, chatId }, text, {
				inline_keyboard: [
					[
						{
							text: "Open logs",
							url: `${ctx.dashboardBaseUrl}/logs/${ctx.endpointId}`,
						},
					],
				],
			});
		} else if (channel.type === "SLACK") {
			const webhookUrl =
				typeof config.webhookUrl === "string" ? config.webhookUrl : "";
			if (!webhookUrl) {
				throw new BadRequestException(
					"Slack channel requires webhookUrl in config",
				);
			}
			const payload = this.buildSlackBlockKit(ctx);
			await this.slack.sendBlockKit({ webhookUrl }, payload);
		} else if (channel.type === "EMAIL") {
			const emails = parseEmailRecipients(config);
			if (emails.length === 0) {
				throw new BadRequestException(
					"Email channel requires config.emails (string[]) or config.email",
				);
			}
			const subject = `[Proxy alert] ${ctx.endpointName} — ${ctx.condition}`;
			const text = this.formatPlainAlert(ctx);
			const html = this.formatEmailHtml(ctx);
			for (const to of emails) {
				await this.emailService.sendAlertEmail(to, subject, text, html);
			}
		}
	}

	private formatPlainAlert(ctx: AlertContext): string {
		return (
			`Endpoint: ${ctx.endpointName}\n` +
			`Condition: ${ctx.condition}\n` +
			`Method: ${ctx.log.method}\n` +
			`Path: ${ctx.log.path}\n` +
			`Status: ${ctx.log.responseStatus ?? "N/A"}\n` +
			`Latency: ${ctx.log.durationMs ?? "N/A"} ms\n` +
			`Logs: ${ctx.dashboardBaseUrl}/logs/${ctx.endpointId}`
		);
	}

	private formatEmailHtml(ctx: AlertContext): string {
		const status = ctx.log.responseStatus ?? "N/A";
		const latency = ctx.log.durationMs ?? "N/A";
		return `<h2>API alert</h2>
<p><strong>Endpoint</strong> ${escapeHtml(ctx.endpointName)}</p>
<p><strong>Condition</strong> ${escapeHtml(ctx.condition)}</p>
<table cellpadding="6">
<tr><td>Method</td><td><code>${escapeHtml(ctx.log.method)}</code></td></tr>
<tr><td>Path</td><td><code>${escapeHtml(ctx.log.path)}</code></td></tr>
<tr><td>Status</td><td>${escapeHtml(String(status))}</td></tr>
<tr><td>Latency</td><td>${escapeHtml(String(latency))} ms</td></tr>
</table>
<p><a href="${escapeHtml(ctx.dashboardBaseUrl)}/logs/${escapeHtml(ctx.endpointId)}">Open logs</a></p>`;
	}

	private formatTelegramHtml(ctx: AlertContext): string {
		const st = ctx.log.responseStatus ?? "N/A";
		const icon =
			typeof ctx.log.responseStatus === "number" &&
			ctx.log.responseStatus >= 500
				? "🔴"
				: "🟡";
		return (
			`${icon} <b>API alert</b>\n` +
			`<b>Endpoint</b>: ${escapeHtml(ctx.endpointName)}\n` +
			`<b>Condition</b>: ${escapeHtml(ctx.condition)}\n` +
			`<b>Method</b>: <code>${escapeHtml(ctx.log.method)}</code>\n` +
			`<b>Path</b>: <code>${escapeHtml(ctx.log.path)}</code>\n` +
			`<b>Status</b>: ${escapeHtml(String(st))}\n` +
			`<b>Latency</b>: ${escapeHtml(String(ctx.log.durationMs ?? "N/A"))} ms`
		);
	}

	private buildSlackBlockKit(ctx: AlertContext): Record<string, unknown> {
		const status = ctx.log.responseStatus ?? "N/A";
		const fallback = `[Proxy alert] ${ctx.endpointName} ${ctx.condition}`;
		return {
			text: fallback,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `:warning: *API alert*\n*Endpoint:* ${ctx.endpointName}\n*Condition:* \`${ctx.condition}\``,
					},
				},
				{
					type: "section",
					fields: [
						{ type: "mrkdwn", text: `*Method*\n\`${ctx.log.method}\`` },
						{ type: "mrkdwn", text: `*Path*\n\`${ctx.log.path}\`` },
						{
							type: "mrkdwn",
							text: `*Status*\n${String(status)}`,
						},
						{
							type: "mrkdwn",
							text: `*Latency*\n${String(ctx.log.durationMs ?? "N/A")} ms`,
						},
					],
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: { type: "plain_text", text: "Mute 1h" },
							action_id: "mute_alert",
							value: JSON.stringify({
								endpointId: ctx.endpointId,
								channelId: ctx.channelId,
								ms: 3_600_000,
							}),
						},
						{
							type: "button",
							text: { type: "plain_text", text: "View logs" },
							url: `${ctx.dashboardBaseUrl}/logs/${ctx.endpointId}`,
						},
					],
				},
			],
		};
	}
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseEmailRecipients(config: Record<string, unknown>): string[] {
	if (Array.isArray(config.emails)) {
		return config.emails.filter((e): e is string => typeof e === "string");
	}
	if (typeof config.email === "string") {
		return [config.email];
	}
	return [];
}
