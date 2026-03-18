import { ApiProperty } from "@nestjs/swagger";

export class AuthUserSchema {
	@ApiProperty({
		description: "Unique user identifier (UUID)",
		example: "550e8400-e29b-41d4-a716-446655440000",
		format: "uuid",
	})
	id: string;

	@ApiProperty({
		description: "User email address",
		example: "user@example.com",
		format: "email",
	})
	email: string;

	@ApiProperty({
		description: "User display name",
		example: "John Doe",
		nullable: true,
	})
	name: string | null;

	constructor(id: string, email: string, name: string) {
		this.id = id;
		this.email = email;
		this.name = name;
	}
}

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
