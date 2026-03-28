import { Test } from "@nestjs/testing";
import { PrismaService } from "../../core/prisma/prisma.service";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
	it("liveness returns ok without hitting the database", async () => {
		const moduleRef = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{
					provide: PrismaService,
					useValue: { $queryRaw: jest.fn() },
				},
			],
		}).compile();
		const controller = moduleRef.get(HealthController);
		expect(controller.liveness()).toEqual({ status: "ok" });
	});
});
