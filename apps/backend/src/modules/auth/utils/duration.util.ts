export function parseDurationToMs(input: string): number {
	const s = input.trim();
	const m = /^(\d+)([smhd])$/i.exec(s);
	if (!m) {
		throw new Error(
			`Invalid duration "${input}": expected pattern like 15m, 7d, 24h, or 3600s`,
		);
	}
	const n = Number(m[1]);
	const u = m[2].toLowerCase();
	const mult =
		u === "s" ? 1000 : u === "m" ? 60_000 : u === "h" ? 3_600_000 : 86_400_000;
	return n * mult;
}
