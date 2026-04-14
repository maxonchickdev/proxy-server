import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/prisma/prisma.module";
import { EndpointsController } from "./endpoints.controller";
import { EndpointsService } from "./endpoints.service";

@Module({
	imports: [PrismaModule],
	controllers: [EndpointsController],
	providers: [EndpointsService],
	exports: [EndpointsService],
})
export class EndpointsModule {}
