import { Link } from "react-router-dom";
import { EndpointsTableComponent } from "../components/endpoints-table.component";
import { useEndpointsList } from "../hooks/endpoints.hooks";

export const DashboardPage = () => {
	const { data: endpoints = [], isLoading } = useEndpointsList();

	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-medium">Dashboard</h1>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="border border-white/20 p-6">
					<p className="text-sm text-white/60">Total Endpoints</p>
					<p className="mt-1 text-2xl font-medium">
						{isLoading ? "..." : endpoints.length}
					</p>
				</div>
			</div>

			<div>
				<h2 className="mb-4 text-lg font-medium">Your Endpoints</h2>
				{isLoading ? (
					<p className="text-white/60">Loading...</p>
				) : endpoints.length === 0 ? (
					<div className="border border-dashed border-white/20 p-12 text-center">
						<p className="text-white/60">No endpoints yet</p>
						<Link
							to="/endpoints"
							className="mt-4 inline-block border border-white px-4 py-2 text-sm font-medium hover:bg-white hover:text-black"
						>
							Create your first endpoint
						</Link>
					</div>
				) : (
					<EndpointsTableComponent
						endpoints={endpoints}
						proxyUrlColumn="path"
					/>
				)}
			</div>
		</div>
	);
};
