import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client.api";
import { ButtonComponent } from "../components/ui/button.component";
import { InputComponent } from "../components/ui/input.component";
import { useAuth } from "../contexts/auth.context";

export const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { setSession, user, isReady } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isReady && user) navigate("/", { replace: true });
	}, [isReady, user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await authApi.login({ email, password });
			setSession(res.accessToken, res.user);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-8 text-2xl font-medium">Sign in</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<div className="border border-white/40 p-3 text-white/80">
						{error}
					</div>
				)}
				<InputComponent
					label="Email"
					type="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<InputComponent
					label="Password"
					type="password"
					name="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<ButtonComponent
					type="submit"
					disabled={loading}
					className="w-full py-2"
				>
					{loading ? "Signing in..." : "Sign in"}
				</ButtonComponent>
			</form>
			<p className="mt-4 text-center text-sm text-white/60">
				<Link to="/forgot-password" className="underline hover:text-white">
					Forgot password?
				</Link>
			</p>
			<p className="mt-2 text-center text-white/60">
				Don&apos;t have an account?{" "}
				<Link to="/register" className="underline hover:text-white">
					Register
				</Link>
			</p>
		</div>
	);
};
