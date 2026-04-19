import { ApiProperty } from "@nestjs/swagger";

export class LogoutResponseSchema {
	@ApiProperty({
		description: "Always true when the handler completes without error",
		example: true,
	})
	success!: boolean;
}
