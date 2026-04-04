import { ApiProperty } from "@nestjs/swagger";
import { ENDPOINT_PROTOCOLS } from "@proxy-server/shared";
import { Type } from "class-transformer";
import {
	ArrayMaxSize,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUrl,
	Max,
	Min,
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
	@IsUrl({}, { message: "Target URL must be a valid URL" })
	targetUrl?: string;

	@ApiProperty({
		description: "Proxy protocol for this endpoint",
		enum: ENDPOINT_PROTOCOLS,
		required: false,
	})
	@IsOptional()
	@IsIn([...ENDPOINT_PROTOCOLS])
	protocol?: (typeof ENDPOINT_PROTOCOLS)[number];

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
		description: "Dedicated TCP listen port when protocol is TCP",
		required: false,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1024)
	@Max(65_535)
	tcpProxyPort?: number | null;

	@ApiProperty({
		description: "Whether the endpoint is active",
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
