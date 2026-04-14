import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/prisma/prisma.module";
import { ProxyModule } from "../../proxy/proxy.module";
import { LogsController } from "./logs.controller";
import { LogsService } from "./logs.service";

@Module({
	imports: [ProxyModule, PrismaModule],
	controllers: [LogsController],
	providers: [LogsService],
})
export class LogsModule {}
