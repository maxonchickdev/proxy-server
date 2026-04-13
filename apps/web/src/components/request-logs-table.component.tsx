import type { RequestLogDto } from "@/types/request-log.dto";

export function RequestLogsTableComponent({
	logs,
	onReplay,
}: {
	logs: RequestLogDto[];
	onReplay?: (logId: string) => void;
}) {
	if (logs.length === 0) {
		return (
			<p className="text-white/60">
				No requests yet. Use the proxy URL to send traffic.
			</p>
		);
	}
	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-white/20">
						<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
							Time
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
							Method
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
							Path
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
							Status
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
							Duration
						</th>
						{onReplay ? (
							<th className="px-4 py-2 text-left text-sm font-medium text-white/60">
								Replay
							</th>
						) : null}
					</tr>
				</thead>
				<tbody>
					{logs.map((log) => (
						<tr
							key={log.id}
							className="border-b border-white/10 hover:bg-white/5"
						>
							<td className="px-4 py-2 text-sm text-white/80">
								{new Date(log.createdAt).toLocaleString()}
							</td>
							<td className="px-4 py-2 font-mono text-sm text-white/80">
								{log.method}
							</td>
							<td className="px-4 py-2 font-mono text-sm text-white/60 truncate max-w-[200px]">
								{log.path}
							</td>
							<td className="px-4 py-2 text-sm text-white/80">
								{log.responseStatus ?? "—"}
							</td>
							<td className="px-4 py-2 text-sm text-white/60">
								{log.durationMs != null ? `${log.durationMs}ms` : "—"}
							</td>
							{onReplay ? (
								<td className="px-4 py-2">
									<button
										type="button"
										onClick={() => onReplay(log.id)}
										disabled={log.method.includes("replay")}
										className="border border-white/30 px-2 py-1 text-xs hover:bg-white hover:text-black disabled:opacity-40"
									>
										Replay
									</button>
								</td>
							) : null}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
