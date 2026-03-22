import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class SignUpDto {
	@ApiProperty({
		description: "User email address",
		example: "user@example.com",
		format: "email",
	})
	@IsEmail()
	email!: string;

	@ApiProperty({
		description: "Password (minimum 8 characters)",
		example: "SecureP@ssw0rd",
		minLength: 8,
	})
	@IsString()
	@MinLength(8, { message: "Password must be at least 8 characters" })
	password!: string;

	@ApiProperty({
		description: "Optional display name",
		example: "John Doe",
		required: false,
	})
	@IsOptional()
	@IsString()
	name?: string | undefined;
}
