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
    return <div className="text-white/60">Loading...</div>;
  }

  if (!endpoint) {
    return (
      <div>
        <p className="text-white/80">Endpoint not found</p>
        <Link to="/endpoints" className="mt-4 inline-block underline hover:no-underline">
          Back to endpoints
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/endpoints" className="text-sm text-white/60 hover:text-white">
            ← Endpoints
          </Link>
          <h1 className="mt-2 text-2xl font-medium">{endpoint.name}</h1>
        </div>
        <button
          onClick={() => updateMutation.mutate({ isActive: !endpoint.isActive })}
          disabled={updateMutation.isPending}
          className="border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white hover:text-black disabled:opacity-50"
        >
          {endpoint.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="border border-white/20 p-6">
        <h3 className="mb-2 text-sm font-medium text-white/60">Proxy URL</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 border border-white/20 bg-black px-3 py-2 font-mono text-sm text-white/80">
            {proxyUrl}
          </code>
          <button
            onClick={copyProxyUrl}
            className="border border-white/40 px-3 py-2 text-sm hover:bg-white hover:text-black"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-sm text-white/60">Target: {endpoint.targetUrl}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-white/20 p-4">
          <p className="text-sm text-white/60">Total requests</p>
          <p className="mt-1 text-xl font-medium">{summary?.totalRequests ?? '—'}</p>
        </div>
        <div className="border border-white/20 p-4">
          <p className="text-sm text-white/60">Last 24h</p>
          <p className="mt-1 text-xl font-medium">{summary?.requestsLast24h ?? '—'}</p>
        </div>
        <div className="border border-white/20 p-4">
          <p className="text-sm text-white/60">Avg latency</p>
          <p className="mt-1 text-xl font-medium">
            {summary?.avgLatencyMs != null ? `${summary.avgLatencyMs}ms` : '—'}
          </p>
        </div>
        <div className="border border-white/20 p-4">
          <p className="text-sm text-white/60">Uptime</p>
          <p className="mt-1 text-xl font-medium">
            {summary?.uptimePercent != null ? `${summary.uptimePercent.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {timeseries.length > 0 && (
        <div className="border border-white/20 p-6">
          <h3 className="mb-4 text-lg font-medium">Request volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="bucket" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #444' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#fff" fill="#fff" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="border border-white/20 p-6">
        <h3 className="mb-4 text-lg font-medium">Recent requests</h3>
        {logsData?.logs && logsData.logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60">Time</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60">Method</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60">Path</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logsData.logs.map((log: Record<string, unknown>) => (
                  <tr key={String(log.id)} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-2 text-sm text-white/80">
                      {log.createdAt ? new Date(String(log.createdAt)).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-white/80">{String(log.method)}</td>
                    <td className="px-4 py-2 font-mono text-sm text-white/60 truncate max-w-[200px]">
                      {String(log.path)}
                    </td>
                    <td className="px-4 py-2 text-sm text-white/80">
                      {String(log.responseStatus ?? '—')}
                    </td>
                    <td className="px-4 py-2 text-sm text-white/60">
                      {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/60">No requests yet. Use the proxy URL to send traffic.</p>
        )}
      </div>
    </div>
  );
}
