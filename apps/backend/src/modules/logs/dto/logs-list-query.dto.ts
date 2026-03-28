import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from "class-validator";
import { paginationConstants } from "../../../common/constants/pagination.constants";

/**
 * Query parameters for `GET /logs/endpoint/:endpointId`.
 */
export class LogsListQueryDto {
	@ApiPropertyOptional({ description: "Max results", default: 50 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(paginationConstants.MAX_LIST_LIMIT)
	limit?: number;

	@ApiPropertyOptional({ description: "Pagination offset", default: 0 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(paginationConstants.DEFAULT_OFFSET)
	offset?: number;

	@ApiPropertyOptional({ description: "Filter by HTTP method" })
	@IsOptional()
	@IsString()
	@MaxLength(16)
	method?: string;

	@ApiPropertyOptional({ description: "Filter by response status code" })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(100)
	@Max(599)
	status?: number;
}
