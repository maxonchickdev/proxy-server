import { Module } from "@nestjs/common";
import { LogsController } from "./logs.controller";
import { LogsService } from "./logs.service";

/**
 * Request log listing feature module.
 */
@Module({
	controllers: [LogsController],
	providers: [LogsService],
})
export class LogsModule {}
