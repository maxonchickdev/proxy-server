import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundaryComponent } from "@/components/error-boundary.component";
import { LayoutComponent } from "@/components/layout.component";
import { AuthProvider, useAuth } from "@/contexts/auth.context";
import { DashboardPage } from "@/pages/dashboard.page";
import { EndpointDetailPage } from "@/pages/endpoint-detail.page";
import { EndpointsPage } from "@/pages/endpoints.page";
import { ForgotPasswordPage } from "@/pages/forgot-password.page";
import { IntegrationsPage } from "@/pages/integrations.page";
import { LoginPage } from "@/pages/login.page";
import { LogsPage } from "@/pages/logs.page";
import { RegisterPage } from "@/pages/register.page";
import { ResetPasswordPage } from "@/pages/reset-password.page";
import { SettingsPage } from "@/pages/settings.page";
import { VerifyEmailPage } from "@/pages/verify-email.page";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
		},
	},
});

function ProtectedRoute({ children }: { children: ReactNode }) {
	const { user, isReady } = useAuth();
	if (!isReady) {
		return (
			<main
				className="flex min-h-screen items-center justify-center bg-black"
				aria-busy="true"
				aria-live="polite"
			>
				<p className="text-white">Loading...</p>
			</main>
		);
	}
	if (!user) {
		return <Navigate to="/login" replace />;
	}
	return <>{children}</>;
}

export default function App() {
	return (
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<ErrorBoundaryComponent>
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
								<Route path="integrations" element={<IntegrationsPage />} />
							</Route>
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</ErrorBoundaryComponent>
					<ReactQueryDevtools initialIsOpen={false} />
				</AuthProvider>
			</QueryClientProvider>
		</BrowserRouter>
	);
}
