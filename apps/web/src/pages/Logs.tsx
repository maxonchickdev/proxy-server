import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { endpointsApi, logsApi } from '../api/client';

export function Logs() {
  const { endpointId } = useParams<{ endpointId?: string }>();

  const { data: endpoints = [] } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['logs', endpointId],
    queryFn: () => logsApi.byEndpoint(endpointId!, { limit: 50 }),
    enabled: !!endpointId,
  });

  if (!endpointId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Request logs</h1>
        <p className="text-slate-400">Select an endpoint to view logs:</p>
        <ul className="space-y-2">
          {endpoints.map((ep) => (
            <li key={ep.id}>
              <Link
                to={`/logs/${ep.id}`}
                className="text-blue-400 hover:underline"
              >
                {ep.name} ({ep.slug})
              </Link>
            </li>
          ))}
        </ul>
        {endpoints.length === 0 && (
          <p className="text-slate-500">No endpoints yet.</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading logs...</p>;
  }

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Request logs</h1>
      <p className="text-slate-400">
        {total} total requests
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Method
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Path
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((log: Record<string, unknown>) => (
              <tr key={String(log.id)} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-sm text-slate-300">
                  {log.createdAt
                    ? new Date(String(log.createdAt)).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-slate-300">
                  {String(log.method)}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-slate-400 truncate max-w-[300px]">
                  {String(log.path)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs ${
                      (log.responseStatus as number) >= 500
                        ? 'bg-red-900/50 text-red-300'
                        : (log.responseStatus as number) >= 400
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-green-900/50 text-green-300'
                    }`}
                  >
                    {String(log.responseStatus ?? '—')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
