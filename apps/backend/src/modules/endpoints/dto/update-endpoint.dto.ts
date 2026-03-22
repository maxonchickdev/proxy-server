import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsOptional,
	IsString,
	IsUrl,
	MinLength,
} from "class-validator";

export class UpdateEndpointDto {
	@ApiProperty({
		description: "Updated display name for the proxy endpoint",
		example: "My Updated API",
		minLength: 1,
		required: false,
	})
	@IsOptional()
	@IsString()
	@MinLength(1, { message: "Name cannot be empty" })
	name?: string;

	@ApiProperty({
		description: "Updated target URL to proxy requests to",
		example: "https://api.example.com/v2",
		format: "uri",
		required: false,
	})
	@IsOptional()
	@IsUrl({}, { message: "Target URL must be a valid URL" })
	targetUrl?: string;

	@ApiProperty({
		description: "Whether the endpoint is active",
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
