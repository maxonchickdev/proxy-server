import type { ProxyType } from "../types/proxy.type.js";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";

export const proxyRegister = registerAs(ConfigKeyEnum.PROXY, (): ProxyType => {
	const grpcPort = Number.parseInt(process.env.GRPC_PROXY_PORT ?? "0", 10);
	return {
		baseDomain: process.env.PROXY_BASE_DOMAIN || "lvh.me",
		grpcProxyPort: Number.isFinite(grpcPort) && grpcPort > 0 ? grpcPort : 0,
	};
});
