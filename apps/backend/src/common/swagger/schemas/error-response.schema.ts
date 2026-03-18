import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseSchema {
	@ApiProperty({
		description: "HTTP status code",
		example: 400,
		minimum: 400,
		maximum: 599,
	})
	statusCode: number;

	@ApiProperty({
		description: "Error type or exception name",
		example: "BadRequestException",
	})
	error: string;

	@ApiProperty({
		description: "Human-readable error message(s)",
		oneOf: [
			{ type: "string", example: "Validation failed" },
			{
				type: "array",
				items: { type: "string" },
				example: [
					"email must be an email",
					"password must be longer than 8 characters",
				],
			},
		],
	})
	message: string | string[];

	@ApiProperty({
		description: "Request path that triggered the error",
		example: "/api/v1/auth/register",
		required: false,
	})
	path: string;

	@ApiProperty({
		description: "ISO 8601 timestamp when the error occurred",
		example: "2025-03-18T12:00:00.000Z",
		required: false,
	})
	timestamp: string;

	constructor(
		statusCode: number,
		error: string,
		message: string,
		path: string,
		timestamp: string,
	) {
		this.statusCode = statusCode;
		this.error = error;
		this.message = message;
		this.path = path;
		this.timestamp = timestamp;
	}
}
