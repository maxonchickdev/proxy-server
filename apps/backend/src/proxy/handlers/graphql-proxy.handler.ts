import type { Request } from "express";
import type { ProxyContext } from "../proxy-context.type.js";
import type { ProtocolHandler } from "./protocol-handler.interface.js";
import { Inject, Injectable } from "@nestjs/common";
import { type Endpoint, EndpointProtocol } from "@prisma/generated/client";
import { extractGraphqlRequestMetadata } from "../graphql-metadata.util.js";
import { HttpProxyHandler } from "./http-proxy.handler.js";

@Injectable()
export class GraphqlProxyHandler implements ProtocolHandler {
	readonly protocol = EndpointProtocol.GRAPHQL;

	constructor(
		@Inject(HttpProxyHandler) private readonly httpHandler: HttpProxyHandler,
	) {}

	canHandle(_req: Request, endpoint: Endpoint): boolean {
		return endpoint.protocol === EndpointProtocol.GRAPHQL;
	}

	async handle(ctx: ProxyContext): Promise<void> {
		const base = extractGraphqlRequestMetadata(ctx.requestBody);
		await this.httpHandler.handle({
			...ctx,
			logMetadata: base,
			appendMetadata: ({ responseBodyTruncated }) => {
				if (!responseBodyTruncated) {
					return { graphqlHasErrors: false };
				}
				try {
					const j = JSON.parse(responseBodyTruncated) as {
						errors?: unknown[];
					};
					return {
						graphqlHasErrors: Array.isArray(j.errors) && j.errors.length > 0,
					};
				} catch {
					return { graphqlResponseParseError: true };
				}
			},
		});
	}
}
