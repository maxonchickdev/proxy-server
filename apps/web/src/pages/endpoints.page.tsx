import { type FormEvent, useState } from "react";
import { EndpointsTableComponent } from "@/components/endpoints-table.component";
import { ButtonComponent } from "@/components/ui/button.component";
import { CardComponent } from "@/components/ui/card.component";
import { InputComponent } from "@/components/ui/input.component";
import { LoadingSkeletonComponent } from "@/components/ui/loading-skeleton.component";
import { useCreateEndpoint, useEndpointsList } from "@/hooks/endpoints.hooks";

export const EndpointsPage = () => {
	const [name, setName] = useState("");
	const [targetUrl, setTargetUrl] = useState("");
	const [error, setError] = useState("");
	const {
		data: listData,
		isLoading,
		isError,
		error: listError,
	} = useEndpointsList();
	const endpoints = listData?.items ?? [];
	const createMutation = useCreateEndpoint();
	const createFormErrorId = "create-endpoint-form-error";

	const handleNameChange = (value: string) => {
		setName(value);
	};

	const handleTargetUrlChange = (value: string) => {
		setTargetUrl(value);
	};

	const handleSubmit = async (e: FormEvent) => {
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
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					{error ? (
						<div
							id={createFormErrorId}
							className="border border-white/40 p-3 text-white/80"
							role="alert"
						>
							{error}
						</div>
					) : null}
					<InputComponent
						label="Name"
						type="text"
						name="name"
						value={name}
						onChange={(e) => handleNameChange(e.target.value)}
						placeholder="e.g. Stripe Webhook"
						required
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? createFormErrorId : undefined}
					/>
					<InputComponent
						label="Target URL"
						type="url"
						name="targetUrl"
						value={targetUrl}
						onChange={(e) => handleTargetUrlChange(e.target.value)}
						placeholder="https://api.example.com/webhook"
						required
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? createFormErrorId : undefined}
					/>
					<ButtonComponent type="submit" disabled={createMutation.isPending}>
						{createMutation.isPending ? "Creating..." : "Create"}
					</ButtonComponent>
				</form>
			</CardComponent>

			<section aria-labelledby="ep-list-heading">
				<h2 id="ep-list-heading" className="mb-4 text-lg font-medium">
					Your endpoints ({listData?.total ?? endpoints.length})
				</h2>
				{isError ? (
					<p className="text-red-400/90" role="alert">
						{listError instanceof Error
							? listError.message
							: "Failed to load endpoints"}
					</p>
				) : isLoading ? (
					<LoadingSkeletonComponent rows={5} className="max-w-3xl" />
				) : endpoints.length === 0 ? (
					<p className="text-white/60">No endpoints yet.</p>
				) : (
					<EndpointsTableComponent
						endpoints={endpoints}
						proxyUrlColumn="slug-only"
					/>
				)}
			</section>
		</div>
	);
};
