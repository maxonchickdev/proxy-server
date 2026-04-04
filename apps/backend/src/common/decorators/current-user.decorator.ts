import type { CurrentUserPayload } from "../types/current-user-payload.type";
import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
	(data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user as CurrentUserPayload;
		return data ? user?.[data] : user;
	},
);
