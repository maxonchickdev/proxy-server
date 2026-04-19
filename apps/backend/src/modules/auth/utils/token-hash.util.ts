import { createHash } from "node:crypto";

export function hashOpaqueTokenUtil(raw: string): string {
	return createHash("sha256").update(raw, "utf8").digest("hex");
}
