import { useState } from "react";

import "./Auth.css";
import GoogleButton from "../components/GoogleButton";

const initialForm = { email: "", password: "" };

export default function Login({ onSubmit, onGoogleSubmit }) {
	const [form, setForm] = useState(initialForm);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit?.(form);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSubmit = async (credential) => {
		setError("");
		setIsGoogleSubmitting(true);
		try {
			await onGoogleSubmit?.(credential);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to continue with Google.");
		} finally {
			setIsGoogleSubmitting(false);
		}
	};

	return (
		<main className="login-page">
			<section className="welcome-panel">
				<div className="brand">circle<span>chat</span></div>
				<div className="welcome-copy">
					<h1>Better conversations start here.</h1>
					<p>Bring your team together, share ideas, and stay connected wherever you are.</p>
				</div>
				<div className="message"><small>TEAM CHAT · 9:41 AM</small><strong>Great ideas happen together ✨</strong></div>
			</section>
			<section className="form-panel">
				<form onSubmit={handleSubmit}>
					<h2>Welcome back</h2>
					<p className="subtitle">Sign in to continue to your conversations.</p>
					<label className="field">Email address<input name="email" type="email" value={form.email} onChange={({ target }) => setForm({ ...form, email: target.value })} placeholder="you@example.com" autoComplete="email" required /></label>
					<label className="field">Password<div className="password"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={({ target }) => setForm({ ...form, password: target.value })} placeholder="Enter your password" autoComplete="current-password" required /><button className="show-password" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
					<div className="options"><span /><a href="#forgot">Forgot password?</a></div>
					{error && <p role="alert" className="auth-error">{error}</p>}
					<button className="sign-in" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
					<div className="divider">or continue with</div>
					<GoogleButton onCredential={handleGoogleSubmit} disabled={isSubmitting || isGoogleSubmitting} />
					<p className="signup">Don't have an account? <a href="#signup">Create one</a></p>
				</form>
			</section>
		</main>
	);
}
