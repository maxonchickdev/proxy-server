import { Injectable } from '@nestjs/common';

@Injectable()
export class SlackService {
  async send(config: { webhookUrl: string }, message: string) {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
      }),
    });
    if (!res.ok) {
      throw new Error(`Slack webhook error: ${res.status}`);
    }
  }
}
