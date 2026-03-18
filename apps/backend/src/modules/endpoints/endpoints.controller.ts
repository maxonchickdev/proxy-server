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
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiTooManyRequestsResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import type { CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { CreateEndpointDto } from "./dto/create-endpoint.dto";
import type { UpdateEndpointDto } from "./dto/update-endpoint.dto";
import { EndpointsService } from "./endpoints.service";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

@ApiTags("Endpoints")
@ApiBearerAuth("Bearer")
@Controller("endpoints")
@UseGuards(JwtAuthGuard)
export class EndpointsController {
	constructor(
		@Inject(EndpointsService)
		private readonly endpointsService: EndpointsService,
	) {}

	@Post()
	@ApiOperation({
		summary: "Create endpoint",
		description:
			"Creates a new proxy endpoint. A unique slug is auto-generated.",
	})
	@ApiCreatedResponse({ description: "Endpoint created successfully" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	create(
		@CurrentUser("id") userId: string,
		@Body() createEndpointDto: CreateEndpointDto,
	) {
		return this.endpointsService.create(userId, createEndpointDto);
	}

	@Get()
	@ApiOperation({
		summary: "List endpoints",
		description: "Returns all proxy endpoints for the authenticated user.",
	})
	@ApiOkResponse({ description: "List of endpoints" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	findAll(@CurrentUser("id") userId: string) {
		return this.endpointsService.findAll(userId);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get endpoint by ID",
		description: "Returns a single endpoint by ID. User must own the endpoint.",
	})
	@ApiParam({ name: "id", description: "Endpoint UUID", format: "uuid" })
	@ApiOkResponse({ description: "Endpoint details" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.endpointsService.findOne(id, user);
	}

	@Patch(":id")
	@ApiOperation({
		summary: "Update endpoint",
		description:
			"Updates an existing endpoint. Only provided fields are updated.",
	})
	@ApiParam({ name: "id", description: "Endpoint UUID", format: "uuid" })
	@ApiOkResponse({ description: "Endpoint updated successfully" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	update(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
		@Body() updateEndpointDto: UpdateEndpointDto,
	) {
		return this.endpointsService.update(id, user, updateEndpointDto);
	}

	@Delete(":id")
	@ApiOperation({
		summary: "Delete endpoint",
		description: "Permanently deletes an endpoint and its associated data.",
	})
	@ApiParam({ name: "id", description: "Endpoint UUID", format: "uuid" })
	@ApiOkResponse({ description: "Endpoint deleted successfully" })
	@ApiTooManyRequestsResponse({
		description: "Too Many Requests - Rate limit exceeded",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiInternalServerErrorResponse({
		description: "Internal Server Error - Unexpected server error",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiForbiddenResponse({
		description: "Forbidden - Insufficient permissions",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	@ApiNotFoundResponse({
		description: "Not Found - Resource does not exist",
		schema: {
			$ref: getSchemaPath(ErrorResponseSchema),
		},
	})
	remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.endpointsService.remove(id, user);
	}
}
