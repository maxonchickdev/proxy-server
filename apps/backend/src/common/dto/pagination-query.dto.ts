import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { paginationConstants } from "../constants/pagination.constants";

/**
 * Standard limit/offset query parameters for paginated list endpoints.
 */
export class PaginationQueryDto {
	@ApiPropertyOptional({
		description: "Number of records to return (max 100)",
		default: paginationConstants.DEFAULT_LIST_LIMIT,
		maximum: paginationConstants.MAX_LIST_LIMIT,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(paginationConstants.MAX_LIST_LIMIT)
	limit?: number;

	@ApiPropertyOptional({
		description: "Zero-based offset for pagination",
		default: paginationConstants.DEFAULT_OFFSET,
		minimum: paginationConstants.DEFAULT_OFFSET,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(paginationConstants.DEFAULT_OFFSET)
	offset?: number;
}
