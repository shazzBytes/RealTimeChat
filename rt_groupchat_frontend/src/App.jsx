import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./hooks/useAuth";

export default function App() {
	const [page, setPage] = useState(window.location.hash === "#signup" ? "signup" : "login");
	const { isAuthenticated, login, signup } = useAuth();

	useEffect(() => {
		const handleHashChange = () => setPage(window.location.hash === "#signup" ? "signup" : "login");
		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	if (isAuthenticated) {
		return <main className="authenticated-message">You are signed in.</main>;
	}

	return page === "signup" ? <Signup onSubmit={signup} /> : <Login onSubmit={login} />;
}
