import { useState } from "react";
import { EndpointsTableComponent } from "../components/endpoints-table.component";
import { ButtonComponent } from "../components/ui/button.component";
import { CardComponent } from "../components/ui/card.component";
import { InputComponent } from "../components/ui/input.component";
import { useCreateEndpoint, useEndpointsList } from "../hooks/endpoints.hooks";

export const EndpointsPage = () => {
	const [name, setName] = useState("");
	const [targetUrl, setTargetUrl] = useState("");
	const [error, setError] = useState("");
	const { data: endpoints = [], isLoading } = useEndpointsList();
	const createMutation = useCreateEndpoint();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			await createMutation.mutateAsync({ name, targetUrl });
			setName("");
			setTargetUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create");
		}
	};

	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-medium">Endpoints</h1>

			<CardComponent>
				<h2 className="mb-4 text-lg font-medium">Create endpoint</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="border border-white/40 p-3 text-white/80">
							{error}
						</div>
					)}
					<InputComponent
						label="Name"
						type="text"
						name="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Stripe Webhook"
						required
					/>
					<InputComponent
						label="Target URL"
						type="url"
						name="targetUrl"
						value={targetUrl}
						onChange={(e) => setTargetUrl(e.target.value)}
						placeholder="https://api.example.com/webhook"
						required
					/>
					<ButtonComponent type="submit" disabled={createMutation.isPending}>
						{createMutation.isPending ? "Creating..." : "Create"}
					</ButtonComponent>
				</form>
			</CardComponent>

			<div>
				<h2 className="mb-4 text-lg font-medium">
					Your endpoints ({endpoints.length})
				</h2>
				{isLoading ? (
					<p className="text-white/60">Loading...</p>
				) : endpoints.length === 0 ? (
					<p className="text-white/60">No endpoints yet.</p>
				) : (
					<EndpointsTableComponent
						endpoints={endpoints}
						proxyUrlColumn="slug-only"
					/>
				)}
			</div>
		</div>
	);
};
