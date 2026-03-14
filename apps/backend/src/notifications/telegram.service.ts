import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  async send(config: { botToken: string; chatId: string }, message: string) {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      throw new Error(`Telegram API error: ${res.status}`);
    }
  }
}
