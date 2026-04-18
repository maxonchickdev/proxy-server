import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import {
	ThrottlerModule as CoreThrottlerModule,
	ThrottlerGuard,
} from "@nestjs/throttler";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { ConfigModule } from "../config/config.module";
import { RateLimitType } from "../config/types/rate-limiting.type";

@Module({
	imports: [
		CoreThrottlerModule.forRootAsync({
			inject: [ConfigService],
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const { ttl, limit } = configService.getOrThrow<RateLimitType>(
					ConfigKeyEnum.RATE_LIMIT,
				);

				return [
					{
						name: "default",
						ttl,
						limit,
					},
				];
			},
		}),
	],
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
