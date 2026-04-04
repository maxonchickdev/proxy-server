import type { Endpoint, Prisma } from "@prisma/generated/client";
import type { NextFunction, Request, Response } from "express";

export type HeadersRecord = Record<string, string | string[] | undefined>;

export type ProxyContext = {
	req: Request;
	res: Response;
	next: NextFunction;
	endpoint: Endpoint;
	path: string;
	queryString: string;
	requestBody: Buffer | null;
	headers: HeadersRecord;
	targetUrl: string;
	startTime: number;

	logMetadata?: Prisma.InputJsonValue | null;

	appendMetadata?: (info: {
		responseStatus: number;
		responseBodyTruncated: string | null;
	}) => Record<string, unknown> | null;
};
