import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule as CoreJwtModule } from "@nestjs/jwt";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { ConfigModule } from "../config/config.module";
import { JwtType } from "../config/types/jwt.type";

@Module({
	imports: [
		CoreJwtModule.registerAsync({
			inject: [ConfigService],
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const { accessExpiresIn, secret } = configService.getOrThrow<JwtType>(
					ConfigKeyEnum.JWT,
				);

				return {
					secret,
					signOptions: {
						expiresIn: accessExpiresIn as
							| `${number}m`
							| `${number}h`
							| `${number}d`
							| `${number}s`,
					},
				};
			},
		}),
	],
	exports: [CoreJwtModule],
})
export class JwtModule {}
