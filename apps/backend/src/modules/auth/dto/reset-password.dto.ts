import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: "123456" })
	@IsString()
	@Length(6, 6)
	@Matches(/^\d{6}$/)
	code!: string;

	@ApiProperty({ minLength: 8 })
	@IsString()
	@MinLength(8, { message: "Password must be at least 8 characters" })
	newPassword!: string;
}
