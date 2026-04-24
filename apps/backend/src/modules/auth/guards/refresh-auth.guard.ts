import type { RequestWithRefreshAuthType } from "../types/request-with-refresh-auth.type";
import {
	type CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";
import { RefreshCookieName } from "../constsants/refresh-cookie.constant";

@Injectable()
export class RefreshAuthGuard implements CanActivate {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<RequestWithRefreshAuthType>();
		const raw = req.cookies?.[RefreshCookieName];
		if (!raw) {
			throw new UnauthorizedException("Missing refresh token");
		}
		const { tokenId, user } = await this.authService.validateRefreshToken(raw);
		req.refreshAuth = { rawRefreshToken: raw, tokenId, user };
		return true;
	}
}
