import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
	it("liveness returns ok without hitting the database", async () => {
		const moduleRef = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{
					provide: HealthService,
					useValue: {
						assertDatabaseReady: jest.fn(),
					},
				},
			],
		}).compile();
		const controller = moduleRef.get(HealthController);
		expect(controller.liveness()).toEqual({ status: "ok" });
	});
});
