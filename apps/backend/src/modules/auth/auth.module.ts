import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { PasswordResetService } from "./password-reset.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TokenService } from "./token.service";

/**
 * Authentication, JWT, and refresh session feature module.
 */
@Module({
	imports: [
		EmailModule,
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.registerAsync({
			useFactory: (config: ConfigService) => {
				const expiresIn = config.getOrThrow<string>(
					`${ConfigKeyEnum.JWT}.accessExpiresIn`,
				);
				return {
					secret: config.getOrThrow<string>(`${ConfigKeyEnum.JWT}.secret`),
					signOptions: {
						expiresIn: expiresIn as
							| `${number}m`
							| `${number}h`
							| `${number}d`
							| `${number}s`,
					},
				};
			},
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [
		TokenService,
		PasswordResetService,
		AuthService,
		JwtStrategy,
		JwtAuthGuard,
		RefreshAuthGuard,
	],
	exports: [AuthService, JwtAuthGuard, RefreshAuthGuard],
})
export class AuthModule {}
