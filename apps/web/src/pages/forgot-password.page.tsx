import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/apis/client.api";
import { ButtonComponent } from "@/components/button.component";
import { InputComponent } from "@/components/input.component";

export const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleEmailChange = (value: string) => {
		setEmail(value);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);
		try {
			const r = await authApi.forgotPassword({ email });
			setMessage(r.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Request failed");
		} finally {
			setLoading(false);
		}
	};

	const formErrorId = "forgot-password-form-error";
	const formStatusId = "forgot-password-form-status";

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-2 text-2xl font-medium">Forgot password</h1>
			<p className="mb-8 text-sm text-white/60">
				We&apos;ll email a 6-digit reset code if an account exists.
			</p>
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
				{message ? (
					<div
						id={formStatusId}
						className="border border-white/20 p-3 text-sm text-white/70"
						role="status"
					>
						{message}
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
					aria-describedby={
						[error ? formErrorId : "", message ? formStatusId : ""]
							.filter(Boolean)
							.join(" ") || undefined
					}
				/>
				<ButtonComponent
					type="submit"
					disabled={loading}
					className="w-full py-2"
				>
					{loading ? "Sending..." : "Send reset code"}
				</ButtonComponent>
			</form>
			<p className="mt-6 text-center text-white/60">
				<Link to="/login" className="underline hover:text-white">
					Back to sign in
				</Link>
			</p>
			{message ? (
				<p className="mt-4 text-center">
					<Link
						to={`/reset-password?${new URLSearchParams({ email }).toString()}`}
						className="text-sm underline hover:text-white"
					>
						Enter reset code
					</Link>
				</p>
			) : null}
		</main>
	);
};
