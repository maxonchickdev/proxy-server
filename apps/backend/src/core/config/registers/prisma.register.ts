import type { PrismaType } from "../types/prisma.type.js";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum.js";

export const prismaRegister = registerAs(
	ConfigKeyEnum.PRISMA,
	(): PrismaType => {
		const url = process.env.POSTGRES_URL || "";

		return {
			url,
		};
	},
);
