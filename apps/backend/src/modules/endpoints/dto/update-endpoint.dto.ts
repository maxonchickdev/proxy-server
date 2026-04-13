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
	@IsUrl(
		{ protocols: ["http", "https"], require_protocol: true },
		{ message: "Target URL must be a valid http or https URL" },
	)
	targetUrl?: string;

	@ApiProperty({
		description: "Optional per-endpoint rate limit",
		required: false,
		type: RateLimitConfigDto,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => RateLimitConfigDto)
	rateLimitConfig?: RateLimitConfigDto | null;

	@ApiProperty({
		description: "Transform rules; omit to leave unchanged, null to clear",
		required: false,
		type: [TransformRuleDto],
	})
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TransformRuleDto)
	@ArrayMaxSize(100)
	transformRules?: TransformRuleDto[] | null;

	@ApiProperty({
		description: "Whether the endpoint is active",
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
