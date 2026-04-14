import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { ProxyType } from "../types/proxy.type";

export const proxyRegister = registerAs(ConfigKeyEnum.PROXY, (): ProxyType => {
	const baseDomain = process.env.PROXY_BASE_DOMAIN || "";

	return {
		baseDomain,
	};
});
