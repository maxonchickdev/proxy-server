import {
	Controller,
	Get,
	Inject,
	Param,
	Query,
	UseGuards,
} from "@nestjs/common";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LogsService } from "./logs.service";

@Controller("logs")
@UseGuards(JwtAuthGuard)
export class LogsController {
	constructor(@Inject(LogsService) private readonly logsService: LogsService) {}

	@Get("endpoint/:endpointId")
	async findByEndpoint(
		@Param("endpointId") endpointId: string,
		@CurrentUser() user: CurrentUserPayload,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
		@Query("method") method?: string,
		@Query("status") status?: string,
	) {
		return this.logsService.findByEndpoint(endpointId, user.id, {
			limit: limit ? parseInt(limit, 10) : 50,
			offset: offset ? parseInt(offset, 10) : 0,
			method: method || undefined,
			status: status ? parseInt(status, 10) : undefined,
		});
	}

	@Get(":id")
	async findOne(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
	) {
		return this.logsService.findOne(id, user.id);
	}
}
