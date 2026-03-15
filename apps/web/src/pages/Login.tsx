import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.accessToken, res.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-8 text-2xl font-medium">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="border border-white/40 p-3 text-white/80">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm text-white/60">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/60">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-white py-2 font-medium hover:bg-white hover:text-black disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-white/60">
        Don't have an account?{' '}
        <Link to="/register" className="underline hover:text-white">
          Register
        </Link>
      </p>
    </div>
  );
}
