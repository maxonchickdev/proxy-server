import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsObject } from "class-validator";

const CHANNEL_TYPES = ["TELEGRAM", "SLACK"] as const;
type ChannelType = (typeof CHANNEL_TYPES)[number];

export class CreateChannelDto {
	@ApiProperty({
		description: "Notification channel type",
		enum: CHANNEL_TYPES,
		example: "TELEGRAM",
	})
	@IsIn(CHANNEL_TYPES)
	type: ChannelType;

	@ApiProperty({
		description:
			"Channel-specific configuration. For TELEGRAM: { botToken, chatId }. For SLACK: { webhookUrl }",
		example: { botToken: "1234567890:AAH...", chatId: "-1001234567890" },
	})
	@IsObject()
	config: Record<string, string>;

	constructor(type: ChannelType, config: Record<string, string>) {
		this.type = type;
		this.config = config;
	}
}
