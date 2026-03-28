import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

/** Starts password recovery; response is non-enumerating. */
export class ForgotPasswordDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;
}
