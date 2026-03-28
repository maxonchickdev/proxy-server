import { Module } from "@nestjs/common";
import { EndpointsController } from "./endpoints.controller";
import { EndpointsService } from "./endpoints.service";

/**
 * Proxy endpoint CRUD feature module.
 */
@Module({
	controllers: [EndpointsController],
	providers: [EndpointsService],
	exports: [EndpointsService],
})
export class EndpointsModule {}
