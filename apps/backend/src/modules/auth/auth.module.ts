import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.registerAsync({
			useFactory: (config: ConfigService) => ({
				secret: config.getOrThrow<string>(`${ConfigKeyEnum.JWT}.secret`),
				signOptions: { expiresIn: "7d" },
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard],
	exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
