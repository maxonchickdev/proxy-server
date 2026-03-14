import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-semibold text-white">
              API Observability
            </Link>
            <Link to="/" className="text-slate-400 hover:text-white">
              Dashboard
            </Link>
            <Link to="/endpoints" className="text-slate-400 hover:text-white">
              Endpoints
            </Link>
            <Link to="/settings" className="text-slate-400 hover:text-white">
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
