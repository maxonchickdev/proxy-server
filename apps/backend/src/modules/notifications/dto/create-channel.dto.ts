import { ApiProperty } from "@nestjs/swagger";
import {
	IsIn,
	IsObject,
	registerDecorator,
	type ValidationArguments,
	type ValidationOptions,
} from "class-validator";

const CHANNEL_TYPES = ["TELEGRAM", "SLACK"] as const;
type ChannelType = (typeof CHANNEL_TYPES)[number];

function IsChannelConfig(validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: "isChannelConfig",
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(config: unknown, args: ValidationArguments) {
					const type = (args.object as CreateChannelDto).type;
					if (!config || typeof config !== "object" || config === null) {
						return false;
					}
					const c = config as Record<string, unknown>;
					if (type === "TELEGRAM") {
						return (
							typeof c.botToken === "string" &&
							c.botToken.length > 0 &&
							typeof c.chatId === "string" &&
							c.chatId.length > 0
						);
					}
					if (type === "SLACK") {
						return (
							typeof c.webhookUrl === "string" &&
							c.webhookUrl.startsWith("https://")
						);
					}
					return false;
				},
				defaultMessage(args: ValidationArguments) {
					const type = (args.object as CreateChannelDto).type;
					if (type === "TELEGRAM") {
						return "Telegram config must include non-empty botToken and chatId strings";
					}
					if (type === "SLACK") {
						return "Slack config must include webhookUrl (https URL)";
					}
					return "Invalid channel config";
				},
			},
		});
	};
}

export class CreateChannelDto {
	@ApiProperty({
		description: "Notification channel type",
		enum: CHANNEL_TYPES,
		example: "TELEGRAM",
	})
	@IsIn(CHANNEL_TYPES)
	type!: ChannelType;

	@ApiProperty({
		description:
			"Channel-specific configuration. For TELEGRAM: { botToken, chatId }. For SLACK: { webhookUrl }",
		example: { botToken: "1234567890:AAH...", chatId: "-1001234567890" },
	})
	@IsObject()
	@IsChannelConfig()
	config!: Record<string, string>;
}
