import type { EndpointDto } from "@proxy-server/shared";
import { Link } from "react-router-dom";

type Props = {
	endpoints: EndpointDto[];
	proxyUrlColumn?: "path" | "slug-only";
};

export const EndpointsTableComponent = ({
	endpoints,
	proxyUrlColumn = "path",
}: Props) => {
	return (
		<div className="overflow-hidden border border-white/20">
			<table className="w-full">
				<thead>
					<tr className="border-b border-white/20">
						<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
							Name
						</th>
						<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
							{proxyUrlColumn === "path" ? "Proxy URL" : "Slug"}
						</th>
						<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
							Target
						</th>
						<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
							Status
						</th>
						<th className="px-4 py-3 text-right text-sm font-medium text-white/60">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-white/10">
					{endpoints.map((ep) => (
						<tr key={ep.id} className="hover:bg-white/5">
							<td className="px-4 py-3">{ep.name}</td>
							<td className="px-4 py-3 font-mono text-sm text-white/80">
								{proxyUrlColumn === "path" ? `/r/${ep.slug}` : ep.slug}
							</td>
							<td className="px-4 py-3 text-sm text-white/60 truncate max-w-[200px]">
								{ep.targetUrl}
							</td>
							<td className="px-4 py-3">
								<span
									className={ep.isActive ? "text-white/80" : "text-white/40"}
								>
									{ep.isActive ? "Active" : "Inactive"}
								</span>
							</td>
							<td className="px-4 py-3 text-right">
								<Link
									to={`/endpoints/${ep.id}`}
									className="underline hover:no-underline"
								>
									View
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
