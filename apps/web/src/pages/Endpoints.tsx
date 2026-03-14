import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { endpointsApi } from '../api/client';

export function Endpoints() {
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; targetUrl: string }) =>
      endpointsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setName('');
      setTargetUrl('');
      setError('');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ name, targetUrl });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Endpoints</h1>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Create endpoint</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-900/50 p-3 text-red-300">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe Webhook"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Target URL
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-white">
          Your endpoints ({endpoints.length})
        </h2>
        {isLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : endpoints.length === 0 ? (
          <p className="text-slate-400">No endpoints yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                    Target URL
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
                      {ep.slug}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 truncate max-w-[250px]">
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
