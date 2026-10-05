import { useEffect, useRef } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function GoogleButton({ onCredential, disabled = false }) {
	const buttonRef = useRef(null);
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	useEffect(() => {
		if (!clientId || disabled) return undefined;

		const renderButton = () => {
			if (!window.google?.accounts?.id || !buttonRef.current) return;
			buttonRef.current.replaceChildren();
			window.google.accounts.id.initialize({
				client_id: clientId,
				callback: ({ credential }) => onCredential(credential),
			});
			window.google.accounts.id.renderButton(buttonRef.current, {
				theme: "outline",
				size: "large",
				width: buttonRef.current.clientWidth,
				text: "continue_with",
			});
		};

		const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
		if (existingScript) {
			if (window.google?.accounts?.id) {
				renderButton();
				return undefined;
			}
			existingScript.addEventListener("load", renderButton, { once: true });
			return () => existingScript.removeEventListener("load", renderButton);
		}

		const script = document.createElement("script");
		script.id = GOOGLE_SCRIPT_ID;
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = renderButton;
		document.head.appendChild(script);

		return () => {
			script.onload = null;
		};
	}, [clientId, disabled, onCredential]);

	if (!clientId) {
		return <p className="google-unavailable">Google sign-in is not configured.</p>;
	}

	return <div className="google-button" ref={buttonRef} aria-label="Continue with Google" />;
}
