import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@/apis/client.api";
import { ButtonComponent } from "@/components/button.component";
import { InputComponent } from "@/components/input.component";
import { useAuth } from "@/contexts/auth.context";

export const RegisterPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { user, isReady } = useAuth();

	if (isReady && user) {
		return <Navigate to="/" replace />;
	}

	const handleEmailChange = (value: string) => {
		setEmail(value);
	};

	const handleNameChange = (value: string) => {
		setName(value);
	};

	const handlePasswordChange = (value: string) => {
		setPassword(value);
	};

	const handleSubmit = async (e: FormEvent) => {
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

	const formErrorId = "register-form-error";

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-8 text-2xl font-medium">Create account</h1>
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				{error ? (
					<div
						id={formErrorId}
						className="border border-white/40 p-3 text-white/80"
						role="alert"
					>
						{error}
					</div>
				) : null}
				<InputComponent
					label="Email"
					type="email"
					name="email"
					value={email}
					onChange={(e) => handleEmailChange(e.target.value)}
					required
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? formErrorId : undefined}
				/>
				<InputComponent
					label="Name (optional)"
					type="text"
					name="name"
					value={name}
					onChange={(e) => handleNameChange(e.target.value)}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? formErrorId : undefined}
				/>
				<InputComponent
					label="Password"
					type="password"
					name="password"
					value={password}
					onChange={(e) => handlePasswordChange(e.target.value)}
					minLength={8}
					required
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? formErrorId : undefined}
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
		</main>
	);
};
