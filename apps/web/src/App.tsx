import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/auth.context";
import { LayoutComponent } from "./components/layout.component";
import { LoginPage } from "./pages/login.page";
import { RegisterPage } from "./pages/register.page";
import { DashboardPage } from "./pages/dashboard.page";
import { EndpointsPage } from "./pages/endpoints.page";
import { EndpointDetailPage } from "./pages/endpoint-detail.page";
import { LogsPage } from "./pages/logs.page";
import { SettingsPage } from "./pages/settings.page";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, isReady } = useAuth();
	if (!isReady) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-black">
				<p className="text-white">Loading...</p>
			</div>
		);
	}
	if (!user) {
		return <Navigate to="/login" replace />;
	}
	return <>{children}</>;
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<LayoutComponent />
					</ProtectedRoute>
				}
			>
				<Route index element={<DashboardPage />} />
				<Route path="endpoints" element={<EndpointsPage />} />
				<Route path="endpoints/:id" element={<EndpointDetailPage />} />
				<Route path="logs" element={<LogsPage />} />
				<Route path="logs/:endpointId" element={<LogsPage />} />
				<Route path="settings" element={<SettingsPage />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<AuthProvider>
					<AppRoutes />
				</AuthProvider>
			</BrowserRouter>
		</QueryClientProvider>
	);
}
