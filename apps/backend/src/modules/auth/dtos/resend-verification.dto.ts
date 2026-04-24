import type { ResendVerification } from "@proxy-server/shared";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendVerificationDto implements ResendVerification {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;
}
