import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";

export const LayoutComponent = () => {
	const { user, logout } = useAuth();

	const handleLogout = () => {
		void logout();
	};

	return (
		<div className="min-h-screen bg-black text-white">
			<nav className="border-b border-white/20">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
					<div className="flex items-center gap-8">
						<Link to="/" className="text-lg font-medium">
							API Observability
						</Link>
						<Link to="/" className="text-white/60 hover:text-white">
							Dashboard
						</Link>
						<Link to="/endpoints" className="text-white/60 hover:text-white">
							Endpoints
						</Link>
						<Link to="/logs" className="text-white/60 hover:text-white">
							Logs
						</Link>
						<Link to="/settings" className="text-white/60 hover:text-white">
							Settings
						</Link>
						<Link to="/integrations" className="text-white/60 hover:text-white">
							Integrations
						</Link>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-white/60">{user?.email}</span>
						<button
							type="button"
							onClick={handleLogout}
							className="border border-white/40 px-3 py-1.5 text-sm hover:bg-white hover:text-black"
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
};
