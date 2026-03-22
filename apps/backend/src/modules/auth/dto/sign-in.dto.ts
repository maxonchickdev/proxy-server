import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class SignInDto {
	@ApiProperty({
		description: "User email address",
		example: "user@example.com",
		format: "email",
	})
	@IsEmail()
	email!: string;

	@ApiProperty({
		description: "User password",
		example: "SecureP@ssw0rd",
	})
	@IsString()
	@MinLength(1, { message: "Password is required" })
	password!: string;
}
