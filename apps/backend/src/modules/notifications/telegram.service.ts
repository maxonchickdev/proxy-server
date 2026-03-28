import { Injectable } from "@nestjs/common";
import { outboundWebhookConstants } from "./outbound-webhook.constants";

/**
 * Sends text messages via the Telegram Bot API.
 */
@Injectable()
export class TelegramService {
	async send(
		config: { botToken: string; chatId: string },
		message: string,
	): Promise<void> {
		const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: config.chatId,
				text: message,
				parse_mode: "HTML",
			}),
			signal: AbortSignal.timeout(outboundWebhookConstants.FETCH_TIMEOUT_MS),
		});
		if (!res.ok) {
			throw new Error(`Telegram API error: ${res.status}`);
		}
	}
}
