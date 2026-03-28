import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/client.api";
import { ButtonComponent } from "@/components/ui/button.component";
import { InputComponent } from "@/components/ui/input.component";

export const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const initialEmail = searchParams.get("email") ?? "";
	const [email, setEmail] = useState(initialEmail);
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleEmailChange = (value: string) => {
		setEmail(value);
	};

	const handleCodeChange = (raw: string) => {
		setCode(raw.replace(/\D/g, "").slice(0, 6));
	};

	const handleNewPasswordChange = (value: string) => {
		setNewPassword(value);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await authApi.resetPassword({ email, code, newPassword });
			navigate("/login");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reset failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-8 text-2xl font-medium">Reset password</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				{error ? (
					<div
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
				/>
				<InputComponent
					label="Code from email"
					type="text"
					name="code"
					inputMode="numeric"
					maxLength={6}
					value={code}
					onChange={(e) => handleCodeChange(e.target.value)}
					required
				/>
				<InputComponent
					label="New password"
					type="password"
					name="newPassword"
					value={newPassword}
					onChange={(e) => handleNewPasswordChange(e.target.value)}
					minLength={8}
					required
				/>
				<ButtonComponent
					type="submit"
					disabled={loading || code.length !== 6}
					className="w-full py-2"
				>
					{loading ? "Saving..." : "Update password"}
				</ButtonComponent>
			</form>
			<p className="mt-6 text-center text-white/60">
				<Link to="/login" className="underline hover:text-white">
					Back to sign in
				</Link>
			</p>
		</main>
	);
};
