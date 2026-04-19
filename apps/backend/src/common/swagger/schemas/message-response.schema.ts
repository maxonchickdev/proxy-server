import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseSchema {
	@ApiProperty({
		description: "Human-readable outcome message",
		example:
			"Registration successful. Check your email for a verification code.",
	})
	message!: string;
}
