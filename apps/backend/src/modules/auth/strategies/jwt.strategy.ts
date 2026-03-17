import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { AuthService, type JwtPayload } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(ConfigService) readonly configService: ConfigService,
	) {
		const secret =
			configService.get<string>(`${ConfigKeyEnum.JWT}.secret`) ??
			process.env.JWT_SECRET ??
			"default-secret-change-me";
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		});
	}

	async validate(payload: JwtPayload) {
		const user = await this.authService.validateUserById(payload.sub);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}
