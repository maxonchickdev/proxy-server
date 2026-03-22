import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/auth.context";
import { ErrorBoundaryComponent } from "./components/error-boundary.component";
import { LayoutComponent } from "./components/layout.component";
import { LoginPage } from "./pages/login.page";
import { RegisterPage } from "./pages/register.page";
import { VerifyEmailPage } from "./pages/verify-email.page";
import { ForgotPasswordPage } from "./pages/forgot-password.page";
import { ResetPasswordPage } from "./pages/reset-password.page";
import { DashboardPage } from "./pages/dashboard.page";
import { EndpointsPage } from "./pages/endpoints.page";
import { EndpointDetailPage } from "./pages/endpoint-detail.page";
import { LogsPage } from "./pages/logs.page";
import { SettingsPage } from "./pages/settings.page";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
		},
	},
});

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
			<Route path="/verify-email" element={<VerifyEmailPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
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
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<ErrorBoundaryComponent>
						<AppRoutes />
					</ErrorBoundaryComponent>
					<ReactQueryDevtools initialIsOpen={false} />
				</AuthProvider>
			</QueryClientProvider>
		</BrowserRouter>
	);
}
