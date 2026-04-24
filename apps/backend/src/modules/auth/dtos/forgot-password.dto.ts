import type { ForgotPassword } from "@proxy-server/shared";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto implements ForgotPassword {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;
}
