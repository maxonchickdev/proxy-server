import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  analyticsApi,
  endpointsApi,
  logsApi,
} from '../api/client';

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: endpoint, isLoading } = useQuery({
    queryKey: ['endpoint', id],
    queryFn: () => endpointsApi.get(id!),
    enabled: !!id,
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', id],
    queryFn: () => analyticsApi.summary(id!),
    enabled: !!id,
  });

  const { data: timeseries = [] } = useQuery({
    queryKey: ['analytics', 'timeseries', id],
    queryFn: () => analyticsApi.timeseries(id!, { limit: 24 }),
    enabled: !!id,
  });

  const { data: logsData } = useQuery({
    queryKey: ['logs', id],
    queryFn: () => logsApi.byEndpoint(id!, { limit: 20 }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { isActive?: boolean }) =>
      endpointsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoint', id] });
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
    },
  });

  const apiBase =
    import.meta.env.VITE_API_URL ?? `${window.location.origin.replace(/:\d+$/, '')}:3000`;
  const proxyUrl = endpoint ? `${apiBase}/r/${endpoint.slug}` : '';

  const copyProxyUrl = () => {
    navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!id || (isLoading && !endpoint)) {
    return (
      <div className="text-slate-400">Loading...</div>
    );
  }

  if (!endpoint) {
    return (
      <div>
        <p className="text-red-400">Endpoint not found</p>
        <Link to="/endpoints" className="mt-4 text-blue-400 hover:underline">
          Back to endpoints
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/endpoints" className="text-sm text-slate-400 hover:text-white">
            ← Endpoints
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">{endpoint.name}</h1>
        </div>
        <button
          onClick={() => updateMutation.mutate({ isActive: !endpoint.isActive })}
          disabled={updateMutation.isPending}
          className={`rounded px-4 py-2 text-sm font-medium ${
            endpoint.isActive
              ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'
              : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
          }`}
        >
          {endpoint.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-2 text-sm font-medium text-slate-400">
          Proxy URL (use this instead of your target)
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-slate-800 px-3 py-2 font-mono text-sm text-slate-300">
            {proxyUrl}
          </code>
          <button
            onClick={copyProxyUrl}
            className="rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Target: {endpoint.targetUrl}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Total requests</p>
          <p className="mt-1 text-xl font-bold text-white">
            {summary?.totalRequests ?? '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Last 24h</p>
          <p className="mt-1 text-xl font-bold text-white">
            {summary?.requestsLast24h ?? '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Avg latency</p>
          <p className="mt-1 text-xl font-bold text-white">
            {summary?.avgLatencyMs != null ? `${summary.avgLatencyMs}ms` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm text-slate-400">Uptime</p>
          <p className="mt-1 text-xl font-bold text-white">
            {summary?.uptimePercent != null
              ? `${summary.uptimePercent.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>

      {timeseries.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="mb-4 text-lg font-medium text-white">
            Request volume (usage over time)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="bucket"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-4 text-lg font-medium text-white">Recent requests</h3>
        {logsData?.logs && logsData.logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-2 text-left text-sm text-slate-400">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-slate-400">
                    Method
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-slate-400">
                    Path
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-slate-400">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {logsData.logs.map((log: Record<string, unknown>) => (
                  <tr
                    key={String(log.id)}
                    className="border-b border-slate-800 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2 text-sm text-slate-300">
                      {log.createdAt
                        ? new Date(String(log.createdAt)).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-slate-300">
                      {String(log.method)}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-slate-400 truncate max-w-[200px]">
                      {String(log.path)}
                    </td>
                    <td className="px-4 py-2">
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
                    <td className="px-4 py-2 text-sm text-slate-400">
                      {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No requests yet. Use the proxy URL to send traffic.</p>
        )}
      </div>
    </div>
  );
}
