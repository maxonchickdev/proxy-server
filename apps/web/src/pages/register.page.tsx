import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client.api";
import { ButtonComponent } from "../components/ui/button.component";
import { InputComponent } from "../components/ui/input.component";
import { useAuth } from "../contexts/auth.context";

export const RegisterPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { user, isReady } = useAuth();

	useEffect(() => {
		if (isReady && user) navigate("/", { replace: true });
	}, [isReady, user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await authApi.register({
				email,
				password,
				name: name || undefined,
			});
			navigate(`/verify-email?${new URLSearchParams({ email }).toString()}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-8 text-2xl font-medium">Create account</h1>
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
					label="Name (optional)"
					type="text"
					name="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<InputComponent
					label="Password"
					type="password"
					name="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					minLength={8}
					required
				/>
				<ButtonComponent
					type="submit"
					disabled={loading}
					className="w-full py-2"
				>
					{loading ? "Creating account..." : "Create account"}
				</ButtonComponent>
			</form>
			<p className="mt-4 text-center text-white/60">
				Already have an account?{" "}
				<Link to="/login" className="underline hover:text-white">
					Sign in
				</Link>
			</p>
		</div>
	);
};
