import { useEffect, useState } from "react";
import "./Groups.css";
const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "rt_groupchat_token";
const USER_KEY = "rt_groupchat_user";

export default function Groups({ onLogout }) {
	const [groups, setGroups] = useState([]);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [roomCode, setRoomCode] = useState("");
	const [isCodeCopied, setIsCodeCopied] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [openMenuId, setOpenMenuId] = useState(null);
	const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
	const userId = user?.id;

	const request = async (path, options = {}) => {
		const response = await fetch(`${API_URL}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
				...options.headers,
			},
		});
		const data = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(data.message ?? "Unable to complete request.");
		return data;
	};

	useEffect(() => {
		request(`/groups/rooms?userId=${encodeURIComponent(userId ?? "")}`)
			.then(setGroups)
			.catch((requestError) => setError(requestError.message));
	}, [userId]);

	const createRoom = async (event) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);
		try {
			const group = await request("/groups/rooms", {
				method: "POST",
				body: JSON.stringify({ name, description, owner: userId }),
			});
			setGroups((current) => [group, ...current]);
			setRoomCode(group.roomCode);
			setName("");
			setDescription("");
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const joinRoom = async (event) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);
		try {
			const group = await request("/groups/rooms/join", {
				method: "POST",
				body: JSON.stringify({ code, userId }),
			});
			setGroups((current) => current.some(({ _id }) => _id === group._id) ? current : [group, ...current]);
			setCode("");
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const copyRoomCode = async () => {
		try {
			await navigator.clipboard.writeText(roomCode);
			setIsCodeCopied(true);
			window.setTimeout(() => setIsCodeCopied(false), 2000);
		} catch {
			setError("Unable to copy the room code. Please copy it manually.");
		}
	};

	const deleteRoom = async (group) => {
		if (!window.confirm(`Delete "${group.name}"? This will permanently delete its messages.`)) return;

		setError("");
		setIsSubmitting(true);
		try {
			await request(`/groups/rooms/${group._id}`, {
				method: "DELETE",
				body: JSON.stringify({ userId }),
			});
			setGroups((current) => current.filter(({ _id }) => _id !== group._id));
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogout = async () => {
		try {
			await onLogout?.();
			localStorage.removeItem("rt_groupchat_room");
			window.location.hash = "#login";
		} catch (logoutError) {
			setError(logoutError instanceof Error ? logoutError.message : "Unable to sign out.");
		}
	};

	return (
		<main className="groups-page">
			<header className="groups-header">
				<div>
					<p className="groups-eyebrow">COMMUNITIES</p>
					<h1 className="groups-title">Group chats</h1>
					<p className="groups-subtitle">Create a room or join one with a room code.</p>
				</div>
				<button className="logout-button" type="button" onClick={handleLogout}>Log out</button>
			</header>

			<div className="groups-actions">
				<form className="room-form" onSubmit={createRoom}>
					<h2 className="room-form-title">Create a room</h2>
					<input className="room-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Room name" required />
					<input className="room-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
					<button className="room-button room-button--primary" disabled={isSubmitting}>Create room</button>
				</form>
				<form className="room-form" onSubmit={joinRoom}>
					<h2 className="room-form-title">Join a room</h2>
					<input className="room-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter 6-digit room code" inputMode="numeric" pattern="[0-9]{6}" required />
					<button className="room-button room-button--secondary" disabled={isSubmitting}>Join room</button>
				</form>
			</div>

			{roomCode && (
				<div className="room-status room-status--success room-code-status">
					<span>Room created. Share this code: <strong>{roomCode}</strong></span>
					<button className="copy-code-button" type="button" onClick={copyRoomCode}>
						{isCodeCopied ? "Copied" : "Copy code"}
					</button>
				</div>
			)}
			{error && <p role="alert" className="room-status room-status--error">{error}</p>}

			<section className="groups-list" aria-label="Available group chats">
				{groups.map((group) => (
					<article key={group._id} className="group-card">
						<div className="group-avatar">{group.name.charAt(0).toUpperCase()}</div>
						<div className="group-info">
							<h2 className="group-name">{group.name}</h2>
							<p className="group-description">{group.description || "A group conversation"}</p>
							<span className="group-code">Room code: {group.roomCode}</span>
						</div>
						<div className="group-actions">
							<button
								className="open-chat-button"
								type="button"
								onClick={() => {
									localStorage.setItem("rt_groupchat_room", JSON.stringify(group));
									window.location.hash = `#chat/${group._id}`;
								}}
							>
								Open chat <span aria-hidden="true">→</span>
							</button>
							{String(group.owner) === String(userId) && (
								<div className="group-menu">
									<button
										className="group-menu-button"
										type="button"
										aria-label={`Options for ${group.name}`}
										aria-expanded={openMenuId === group._id}
										onClick={() => setOpenMenuId((current) => current === group._id ? null : group._id)}
									>
										•••
									</button>
									{openMenuId === group._id && (
										<div className="group-menu-dropdown">
											<button
												className="delete-group-button"
												type="button"
												onClick={() => {
													setOpenMenuId(null);
													deleteRoom(group);
												}}
												disabled={isSubmitting}
											>
												Delete group
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</article>
				))}
			</section>
		</main>
	);
}