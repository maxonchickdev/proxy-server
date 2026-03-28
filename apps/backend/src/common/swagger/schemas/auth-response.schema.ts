import { ApiProperty } from "@nestjs/swagger";
import { AuthUserSchema } from "./auth-user.schema";

export class AuthResponseSchema {
	@ApiProperty({
		description: "JWT access token for authenticated requests",
		example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	})
	accessToken: string;

	@ApiProperty({
		description: "Authenticated user details",
		type: AuthUserSchema,
	})
	user: AuthUserSchema;

	constructor(accessToken: string, user: AuthUserSchema) {
		this.accessToken = accessToken;
		this.user = user;
	}
}
