import { Module } from "@nestjs/common";
import { JwtModule } from "../../core/jwt/jwt.module";
import { PassportModule } from "../../core/passport/passport.module";
import { PrismaModule } from "../../core/prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { PasswordResetService } from "./password-reset.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TokenService } from "./token.service";

@Module({
	imports: [PrismaModule, EmailModule, JwtModule, PassportModule],
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
