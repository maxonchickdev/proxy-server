import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

/** Readiness checks used by orchestrators (e.g. database connectivity). */
@Injectable()
export class HealthService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	/** Verifies PostgreSQL is reachable. */
	async assertDatabaseReady(): Promise<void> {
		await this.prisma.$queryRaw`SELECT 1`;
	}
}
