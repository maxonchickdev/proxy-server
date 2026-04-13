import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	ArrayMaxSize,
	IsBoolean,
	IsOptional,
	IsString,
	IsUrl,
	MinLength,
	ValidateNested,
} from "class-validator";
import { RateLimitConfigDto } from "./rate-limit-config.dto";
import { TransformRuleDto } from "./transform-rule.dto";

export class CreateEndpointDto {
	@ApiProperty({
		description: "Display name for the proxy endpoint",
		example: "My API",
		minLength: 1,
	})
	@IsString()
	@MinLength(1, { message: "Name is required" })
	name!: string;

	@ApiProperty({
		description: "Target URL to proxy requests to",
		example: "https://api.example.com",
		format: "uri",
	})
	@IsUrl(
		{ protocols: ["http", "https"], require_protocol: true },
		{ message: "Target URL must be a valid http or https URL" },
	)
	targetUrl!: string;

	@ApiProperty({
		description: "Optional per-endpoint rate limit",
		required: false,
		type: RateLimitConfigDto,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => RateLimitConfigDto)
	rateLimitConfig?: RateLimitConfigDto;

	@ApiProperty({
		description: "Ordered list of request/response transform rules",
		required: false,
		type: [TransformRuleDto],
	})
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TransformRuleDto)
	@ArrayMaxSize(100)
	transformRules?: TransformRuleDto[];

	@ApiProperty({
		description: "Whether the endpoint is active and accepting requests",
		example: true,
		required: false,
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
