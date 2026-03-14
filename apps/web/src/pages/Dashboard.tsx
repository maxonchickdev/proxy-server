import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { endpointsApi } from '../api/client';

export function Dashboard() {
  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list(),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">Total Endpoints</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {isLoading ? '...' : endpoints.length}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-white">Your Endpoints</h2>
        {isLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : endpoints.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-12 text-center">
            <p className="text-slate-400">No endpoints yet</p>
            <Link
              to="/endpoints"
              className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Create your first endpoint
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Proxy URL
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{ep.name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-300">
                      /r/{ep.slug}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 truncate max-w-[200px]">
                      {ep.targetUrl}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          ep.isActive
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {ep.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/endpoints/${ep.id}`}
                        className="text-blue-400 hover:underline"
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
}
