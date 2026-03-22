import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, Matches } from "class-validator";

export class VerifyEmailDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: "123456", description: "6-digit code" })
	@IsString()
	@Length(6, 6)
	@Matches(/^\d{6}$/)
	code!: string;
}
