import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsOptional,
	IsString,
	IsUrl,
	MinLength,
} from "class-validator";

export class CreateEndpointDto {
	@ApiProperty({
		description: "Display name for the proxy endpoint",
		example: "My API",
		minLength: 1,
	})
	@IsString()
	@MinLength(1, { message: "Name is required" })
	name: string;

	@ApiProperty({
		description: "Target URL to proxy requests to",
		example: "https://api.example.com",
		format: "uri",
	})
	@IsUrl({}, { message: "Target URL must be a valid URL" })
	targetUrl: string;

	@ApiProperty({
		description: "Whether the endpoint is active and accepting requests",
		example: true,
		required: false,
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isActive: boolean;

	constructor(name: string, targetUrl: string, isActive: boolean) {
		this.name = name;
		this.targetUrl = targetUrl;
		this.isActive = isActive;
	}
}
