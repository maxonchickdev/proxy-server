import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { CreateEndpointDto } from "./dto/create-endpoint.dto";
import type { UpdateEndpointDto } from "./dto/update-endpoint.dto";
import { EndpointsService } from "./endpoints.service";

@Controller("endpoints")
@UseGuards(JwtAuthGuard)
export class EndpointsController {
	constructor(
		@Inject(EndpointsService)
		private readonly endpointsService: EndpointsService,
	) {}

	@Post()
	create(@CurrentUser("id") userId: string, @Body() dto: CreateEndpointDto) {
		return this.endpointsService.create(userId, dto);
	}

	@Get()
	findAll(@CurrentUser("id") userId: string) {
		return this.endpointsService.findAll(userId);
	}

	@Get(":id")
	findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.endpointsService.findOne(id, user);
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
		@Body() dto: UpdateEndpointDto,
	) {
		return this.endpointsService.update(id, user, dto);
	}

	@Delete(":id")
	remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.endpointsService.remove(id, user);
	}
}
