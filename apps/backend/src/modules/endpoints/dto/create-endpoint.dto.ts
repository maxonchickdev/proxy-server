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
	@IsUrl({}, { message: "Target URL must be a valid URL" })
	targetUrl!: string;

	@ApiProperty({
		description: "Proxy protocol for this endpoint",
		enum: ENDPOINT_PROTOCOLS,
		required: false,
		default: "HTTP",
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
		description: "Dedicated TCP listen port when protocol is TCP",
		required: false,
		example: 19_000,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1024)
	@Max(65_535)
	tcpProxyPort?: number;

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
