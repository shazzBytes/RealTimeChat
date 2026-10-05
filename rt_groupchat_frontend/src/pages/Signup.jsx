import { useState } from "react";

import "./Auth.css";

const initialForm = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export default function Signup({ onSubmit }) {
	const [form, setForm] = useState(initialForm);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = ({ target }) => {
		setForm((currentForm) => ({ ...currentForm, [target.name]: target.value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setIsSubmitting(true);

		try {
			await onSubmit?.({
				name: form.name,
				email: form.email,
				password: form.password,
			});
			setForm(initialForm);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to create your account.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="login-page">
			<section className="welcome-panel">
				<div className="brand">circle<span>chat</span></div>
				<div className="welcome-copy">
					<h1>Make space for better conversations.</h1>
					<p>Create your account and bring your team together in one simple place.</p>
				</div>
				<div className="message"><small>TEAM CHAT · NOW</small><strong>Your team is waiting to connect.</strong></div>
			</section>

			<section className="form-panel">
				<form onSubmit={handleSubmit}>
					<h2>Create your account</h2>
					<p className="subtitle">Sign up to start your conversations.</p>

					<label className="field">
						Full name
						<input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required />
					</label>
					<label className="field">
						Email address
						<input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required />
					</label>
					<label className="field">
						Password
						<div className="password">
							<input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Create a password" autoComplete="new-password" minLength="8" required />
							<button className="show-password" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
						</div>
					</label>
					<label className="field">
						Confirm password
						<div className="password">
							<input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" minLength="8" required />
							<button className="show-password" type="button" onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? "Hide" : "Show"}</button>
						</div>
					</label>

					{error && <p role="alert" className="auth-error">{error}</p>}
					<button className="sign-in" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
					<p className="signup">Already have an account? <a href="#login">Sign in</a></p>
				</form>
			</section>
		</main>
	);
}
