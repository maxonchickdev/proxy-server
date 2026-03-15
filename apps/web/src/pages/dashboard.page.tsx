import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { endpointsApi } from "../api/client.api";

export const DashboardPage = () => {
  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ["endpoints"],
    queryFn: () => endpointsApi.list(),
  });

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
          <div className="overflow-hidden border border-white/20">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Proxy URL
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
                      /r/{ep.slug}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60 truncate max-w-[200px]">
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
