import { Test } from "@nestjs/testing";
import { PrismaService } from "../../core/prisma/prisma.service";
import { EndpointsService } from "./endpoints.service";

describe("EndpointsService", () => {
	it("findAll returns items, total, limit, offset", async () => {
		const items = [
			{
				id: "e1",
				userId: "u1",
				name: "A",
				slug: "abc",
				targetUrl: "https://x.com",
				isActive: true,
				createdAt: new Date(),
			},
		];
		const mockPrisma = {
			endpoint: {
				findMany: jest.fn().mockResolvedValue(items),
				count: jest.fn().mockResolvedValue(3),
			},
		};
		const moduleRef = await Test.createTestingModule({
			providers: [
				EndpointsService,
				{ provide: PrismaService, useValue: mockPrisma },
			],
		}).compile();
		const service = moduleRef.get(EndpointsService);
		const result = await service.findAll("u1", { limit: 50, offset: 10 });
		expect(result.items).toEqual(items);
		expect(result.total).toBe(3);
		expect(result.limit).toBe(50);
		expect(result.offset).toBe(10);
		expect(mockPrisma.endpoint.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "u1" },
				skip: 10,
				take: 50,
			}),
		);
	});
});
