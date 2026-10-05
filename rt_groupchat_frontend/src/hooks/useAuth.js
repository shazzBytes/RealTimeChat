import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "rt_groupchat_token";
const USER_KEY = "rt_groupchat_user";

const readStoredUser = () => {
	try {
		const value = localStorage.getItem(USER_KEY);
		return value ? JSON.parse(value) : null;
	} catch {
		localStorage.removeItem(USER_KEY);
		return null;
	}
};

const clearStoredSession = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};

const requestAuth = async (path, credentials, errorMessage) => {
	const response = await fetch(`${API_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(credentials),
	});
	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.message ?? errorMessage);
	}

	if (!data.token && !data.accessToken) {
		throw new Error("The authentication response did not include a token.");
	}

	return { ...data, token: data.token ?? data.accessToken };
};

export function useAuth({
	loginPath = "/auth/signin",
	signupPath = "/auth/signup",
	logoutPath = "/auth/logout",
} = {}) {
	const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
	const [user, setUser] = useState(readStoredUser);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (token) localStorage.setItem(TOKEN_KEY, token);
	}, [token]);

	const saveSession = (data) => {
		setToken(data.token);
		setUser(data.user ?? null);
		localStorage.setItem(TOKEN_KEY, data.token);
		if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
	};

	const login = useCallback(async (credentials) => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await requestAuth(loginPath, credentials, "Unable to sign in.");
			saveSession(data);
			return data;
		} catch (requestError) {
			setError(requestError);
			throw requestError;
		} finally {
			setIsLoading(false);
		}
	}, [loginPath]);

	const signup = useCallback(async (credentials) => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await requestAuth(signupPath, credentials, "Unable to create your account.");
			saveSession(data);
			return data;
		} catch (requestError) {
			setError(requestError);
			throw requestError;
		} finally {
			setIsLoading(false);
		}
	}, [signupPath]);

	const googleLogin = useCallback(async (credential) => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await requestAuth("/auth/google", { credential }, "Unable to authenticate with Google.");
			saveSession(data);
			return data;
		} catch (requestError) {
			setError(requestError);
			throw requestError;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			if (token) {
				const response = await fetch(`${API_URL}${logoutPath}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok && response.status !== 401 && response.status !== 404) {
					throw new Error("Unable to sign out.");
				}
			}
		} catch (requestError) {
			setError(requestError);
			throw requestError;
		} finally {
			setToken(null);
			setUser(null);
			clearStoredSession();
			setIsLoading(false);
		}
	}, [logoutPath, token]);

	return { token, user, isAuthenticated: Boolean(token), isLoading, error, login, signup, googleLogin, logout };
}
