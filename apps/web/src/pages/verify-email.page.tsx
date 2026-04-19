import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/apis/auth.api";
import { ButtonComponent } from "@/components/button.component";
import { InputComponent } from "@/components/input.component";
import { useAuth } from "@/contexts/auth.context";

export const VerifyEmailPage = () => {
	const [searchParams] = useSearchParams();
	const initialEmail = searchParams.get("email") ?? "";
	const [email, setEmail] = useState(initialEmail);
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [resendMsg, setResendMsg] = useState("");
	const { setSession } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await authApi.verifyEmail({ email, code });
			setSession(res.accessToken, res.user);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	const handleResendClick = async () => {
		setResendMsg("");
		setError("");
		try {
			const r = await authApi.resendVerification({ email });
			setResendMsg(r.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not resend");
		}
	};

	const handleEmailChange = (value: string) => {
		setEmail(value);
	};

	const handleCodeChange = (raw: string) => {
		setCode(raw.replace(/\D/g, "").slice(0, 6));
	};

	const formErrorId = "verify-email-form-error";
	const resendStatusId = "verify-email-resend-status";

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
			<h1 className="mb-2 text-2xl font-medium">Verify your email</h1>
			<p className="mb-8 text-sm text-white/60">
				Enter the 6-digit code we sent to your inbox.
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
				{resendMsg ? (
					<div
						id={resendStatusId}
						className="border border-white/20 p-3 text-sm text-white/70"
						role="status"
					>
						{resendMsg}
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
						[error ? formErrorId : "", resendMsg ? resendStatusId : ""]
							.filter(Boolean)
							.join(" ") || undefined
					}
				/>
				<InputComponent
					label="Code"
					type="text"
					name="code"
					inputMode="numeric"
					pattern="\d{6}"
					maxLength={6}
					value={code}
					onChange={(e) => handleCodeChange(e.target.value)}
					required
					aria-invalid={error ? true : undefined}
					aria-describedby={
						[error ? formErrorId : "", resendMsg ? resendStatusId : ""]
							.filter(Boolean)
							.join(" ") || undefined
					}
				/>
				<ButtonComponent
					type="submit"
					disabled={loading || code.length !== 6}
					className="w-full py-2"
				>
					{loading ? "Verifying..." : "Verify"}
				</ButtonComponent>
			</form>
			<button
				type="button"
				onClick={() => void handleResendClick()}
				className="mt-4 w-full text-center text-sm text-white/60 underline hover:text-white"
			>
				Resend code
			</button>
			<p className="mt-6 text-center text-white/60">
				<Link to="/login" className="underline hover:text-white">
					Back to sign in
				</Link>
			</p>
		</main>
	);
};
