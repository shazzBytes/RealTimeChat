import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Groups from "./pages/Groups";
import Chat from "./pages/Chat";
import { useAuth } from "./hooks/useAuth";

export default function App() {
	const [page, setPage] = useState(window.location.hash.startsWith("#chat/") ? "chat" : window.location.hash === "#signup" ? "signup" : "login");
	const { isAuthenticated, login, signup, googleLogin } = useAuth();

	useEffect(() => {
		const handleHashChange = () => setPage(window.location.hash.startsWith("#chat/") ? "chat" : window.location.hash === "#signup" ? "signup" : "login");
		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	if (isAuthenticated) {
		return page === "chat" ? <Chat /> : <Groups />;
	}

	return page === "signup"
		? <Signup onSubmit={signup} onGoogleSubmit={googleLogin} />
		: <Login onSubmit={login} onGoogleSubmit={googleLogin} />;
}
