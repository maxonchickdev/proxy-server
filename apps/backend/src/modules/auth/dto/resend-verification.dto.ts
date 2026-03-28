import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

/** Requests a new verification code for an unverified account. */
export class ResendVerificationDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;
}
