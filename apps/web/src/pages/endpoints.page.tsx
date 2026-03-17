import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { endpointsApi } from "../api/client.api";

export const EndpointsPage = () => {
	const [name, setName] = useState("");
	const [targetUrl, setTargetUrl] = useState("");
	const [error, setError] = useState("");
	const queryClient = useQueryClient();

	const { data: endpoints = [], isLoading } = useQuery({
		queryKey: ["endpoints"],
		queryFn: () => endpointsApi.list(),
	});

	const createMutation = useMutation({
		mutationFn: (data: { name: string; targetUrl: string }) =>
			endpointsApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints"] });
			setName("");
			setTargetUrl("");
			setError("");
		},
		onError: (err) => {
			setError(err instanceof Error ? err.message : "Failed to create");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		createMutation.mutate({ name, targetUrl });
	};

	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-medium">Endpoints</h1>

			<div className="border border-white/20 p-6">
				<h2 className="mb-4 text-lg font-medium">Create endpoint</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="border border-white/40 p-3 text-white/80">
							{error}
						</div>
					)}
					<div>
						<label className="mb-1 block text-sm text-white/60">Name</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Stripe Webhook"
							className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
							required
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm text-white/60">
							Target URL
						</label>
						<input
							type="url"
							value={targetUrl}
							onChange={(e) => setTargetUrl(e.target.value)}
							placeholder="https://api.example.com/webhook"
							className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={createMutation.isPending}
						className="border border-white px-4 py-2 font-medium hover:bg-white hover:text-black disabled:opacity-50"
					>
						{createMutation.isPending ? "Creating..." : "Create"}
					</button>
				</form>
			</div>

			<div>
				<h2 className="mb-4 text-lg font-medium">
					Your endpoints ({endpoints.length})
				</h2>
				{isLoading ? (
					<p className="text-white/60">Loading...</p>
				) : endpoints.length === 0 ? (
					<p className="text-white/60">No endpoints yet.</p>
				) : (
					<div className="overflow-hidden border border-white/20">
						<table className="w-full">
							<thead>
								<tr className="border-b border-white/20">
									<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
										Name
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
										Slug
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-white/60">
										Target URL
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
											{ep.slug}
										</td>
										<td className="px-4 py-3 text-sm text-white/60 truncate max-w-[250px]">
											{ep.targetUrl}
										</td>
										<td className="px-4 py-3">
											<span
												className={
													ep.isActive ? "text-white/80" : "text-white/40"
												}
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
				)}
			</div>
		</div>
	);
};
