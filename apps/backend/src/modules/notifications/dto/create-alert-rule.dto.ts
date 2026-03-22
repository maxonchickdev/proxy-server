import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MinLength } from "class-validator";

export class CreateAlertRuleDto {
	@ApiProperty({
		description: "ID of the endpoint to monitor",
		example: "550e8400-e29b-41d4-a716-446655440000",
		format: "uuid",
	})
	@IsUUID()
	endpointId!: string;

	@ApiProperty({
		description: "ID of the notification channel to use",
		example: "550e8400-e29b-41d4-a716-446655440001",
		format: "uuid",
	})
	@IsUUID()
	channelId!: string;

	@ApiProperty({
		description:
			"Alert condition expression (e.g. 'status >= 500', 'latency > 2000')",
		example: "status >= 500",
		minLength: 1,
	})
	@IsString()
	@MinLength(1, { message: "Condition is required" })
	condition!: string;
}
