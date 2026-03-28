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

	constructor(id: string, email: string, name: string | null) {
		this.id = id;
		this.email = email;
		this.name = name;
	}
}
