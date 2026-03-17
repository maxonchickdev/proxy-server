import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { ProxyType } from "../types/proxy.type.js";

export const proxyRegister = registerAs(ConfigKeyEnum.PROXY, (): ProxyType => {
	return {
		baseDomain: process.env.PROXY_BASE_DOMAIN || "lvh.me",
	};
});
