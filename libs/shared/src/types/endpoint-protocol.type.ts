export const ENDPOINT_PROTOCOLS = ["HTTP"] as const;

export type EndpointProtocol = (typeof ENDPOINT_PROTOCOLS)[number];
