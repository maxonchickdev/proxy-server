import { type ExecutionContext, Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../../../common/constants/is-public-key.constant";

/** Rejects unauthenticated access unless the route is marked with the public metadata key. */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
	constructor(private readonly reflector: Reflector) {
		super();
	}

	override canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}
		return super.canActivate(context);
	}
}
