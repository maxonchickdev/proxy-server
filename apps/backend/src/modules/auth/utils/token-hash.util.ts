import { createHash } from "node:crypto";

export function hashOpaqueToken(raw: string): string {
	return createHash("sha256").update(raw, "utf8").digest("hex");
}
