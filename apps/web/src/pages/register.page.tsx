import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client.api";
import { useAuth } from "../contexts/auth.context";

export const RegisterPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await authApi.register({
				email,
				password,
				name: name || undefined,
			});
			login(res.accessToken, res.user);
			navigate("/");
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
					<label className="mb-1 block text-sm text-white/60">
						Name (optional)
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm text-white/60">Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
						minLength={8}
						required
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="w-full border border-white py-2 font-medium hover:bg-white hover:text-black disabled:opacity-50"
				>
					{loading ? "Creating account..." : "Create account"}
				</button>
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
