-- Normalize legacy multi-protocol rows to HTTP before shrinking the enum.
UPDATE "endpoints" SET "protocol" = 'HTTP' WHERE "protocol" != 'HTTP';

ALTER TABLE "endpoints" ALTER COLUMN "protocol" DROP DEFAULT;
ALTER TABLE "endpoints" ALTER COLUMN "protocol" TYPE TEXT USING "protocol"::TEXT;

DROP TYPE "EndpointProtocol";

CREATE TYPE "EndpointProtocol" AS ENUM ('HTTP');

ALTER TABLE "endpoints" ALTER COLUMN "protocol" TYPE "EndpointProtocol" USING "protocol"::"EndpointProtocol";
ALTER TABLE "endpoints" ALTER COLUMN "protocol" SET DEFAULT 'HTTP'::"EndpointProtocol";
ALTER TABLE "endpoints" ALTER COLUMN "protocol" SET NOT NULL;

ALTER TABLE "endpoints" DROP COLUMN IF EXISTS "tcp_proxy_port";
