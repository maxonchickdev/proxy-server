import { Injectable } from "@nestjs/common";
import { outboundWebhookConstants } from "./outbound-webhook.constants";

/**
 * Sends messages to Slack incoming webhooks.
 */
@Injectable()
export class SlackService {
	async send(config: { webhookUrl: string }, message: string): Promise<void> {
		const res = await fetch(config.webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				text: message,
			}),
			signal: AbortSignal.timeout(outboundWebhookConstants.FETCH_TIMEOUT_MS),
		});
		if (!res.ok) {
			throw new Error(`Slack webhook error: ${res.status}`);
		}
	}
}
