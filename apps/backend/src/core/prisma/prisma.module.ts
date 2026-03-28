import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

/**
 * Global Prisma client provider.
 */
@Global()
@Module({
	imports: [ConfigModule],
	providers: [PrismaService],
	exports: [PrismaService],
})
export class PrismaModule {}
