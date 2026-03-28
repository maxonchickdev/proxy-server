import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Query,
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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import { CreateEndpointDto } from "./dto/create-endpoint.dto";
import { ListEndpointsQueryDto } from "./dto/list-endpoints-query.dto";
import { UpdateEndpointDto } from "./dto/update-endpoint.dto";
import { EndpointsService } from "./endpoints.service";
import { ErrorResponseSchema } from "src/common/swagger/schemas/error-response.schema";

/**
 * HTTP API for creating and managing user-owned proxy endpoints.
 */
@ApiTags("Endpoints")
@ApiBearerAuth("Bearer")
@Controller("endpoints")
export class EndpointsController {
	constructor(
		@Inject(EndpointsService)
		private readonly endpointsService: EndpointsService,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
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
	): ReturnType<EndpointsService["create"]> {
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
	findAll(
		@CurrentUser("id") userId: string,
		@Query() query: ListEndpointsQueryDto,
	): ReturnType<EndpointsService["findAll"]> {
		return this.endpointsService.findAll(userId, query);
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
	findOne(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
	): ReturnType<EndpointsService["findOne"]> {
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
	): ReturnType<EndpointsService["update"]> {
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
	remove(
		@Param("id") id: string,
		@CurrentUser() user: CurrentUserPayload,
	): ReturnType<EndpointsService["remove"]> {
		return this.endpointsService.remove(id, user);
	}
}
