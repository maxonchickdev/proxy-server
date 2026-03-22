import {
	type CallHandler,
	type ExecutionContext,
	GatewayTimeoutException,
	Inject,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	catchError,
	type Observable,
	TimeoutError,
	throwError,
	timeout,
} from "rxjs";
import { ConfigKeyEnum } from "../enums/config.enum.js";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	private readonly appRequestTimeout: number;

	constructor(
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {
		this.appRequestTimeout = Number(
			this.configService.getOrThrow<number>(
				`${ConfigKeyEnum.APP}.appRequestTimeout`,
			),
		);
	}

	intercept(
		_context: ExecutionContext,
		next: CallHandler<unknown>,
	): Observable<unknown> {
		return next.handle().pipe(
			timeout(this.appRequestTimeout),
			catchError((e) => {
				if (e instanceof TimeoutError) {
					throw new GatewayTimeoutException("Timeout has occurred");
				}
				return throwError(() => e);
			}),
		);
	}
}
