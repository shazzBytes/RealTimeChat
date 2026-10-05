import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'rt_groupchat_token';
const USER_KEY = 'rt_groupchat_user';
const ROOM_KEY = 'rt_groupchat_room';

function Avatar({ name, color }) {
	return <span className="chat-avatar" style={{ backgroundColor: color }}>{name.split(' ').map((word) => word[0]).join('')}</span>;
}

export default function Chat({ onLogout }) {
	const [room, setRoom] = useState(() => JSON.parse(localStorage.getItem(ROOM_KEY) || 'null'));
	const [user] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
	const [messages, setMessages] = useState([]);
	const [draft, setDraft] = useState('');
	const [error, setError] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [onlineIds, setOnlineIds] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const socketRef = useRef(null);
	const members = room?.members ?? [];
	const typingLabel = typingUsers.length === 1
		? `${typingUsers[0].name} is typing...`
		: typingUsers.length > 1 ? 'Several people are typing...' : '';

	useEffect(() => {
		if (!room?._id) return undefined;

		const socket = io(API_URL || window.location.origin, {
			auth: { token: localStorage.getItem(TOKEN_KEY) },
		});
		socketRef.current = socket;
		const addMessage = (message) => {
			setMessages((current) => current.some(({ _id }) => _id === message._id)
				? current
				: [...current, message]);
		};

		socket.on('connect', () => socket.emit('joinGroup', {
			groupId: room._id,
			user: { id: user?.id, name: user?.name },
		}));
		socket.on('groupMessage', addMessage);
		socket.on('groupDeleted', ({ groupId }) => {
			if (groupId === room._id) {
				localStorage.removeItem(ROOM_KEY);
				window.location.hash = '#groups';
			}
		});
		socket.on('roomPresence', ({ online, typing }) => {
			setOnlineIds(online.map(({ id }) => String(id)));
			setTypingUsers(typing.filter(({ id }) => String(id) !== String(user?.id)));
		});

		fetch(`${API_URL}/groups/${room._id}/messages`, {
			headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
		})
			.then(async (response) => {
				const data = await response.json();
				if (!response.ok) throw new Error(data.message || 'Unable to load chat history.');
				return data;
			})
			.then((history) => setMessages((current) => {
				const historyIds = new Set(history.map(({ _id }) => _id));
				return [...history, ...current.filter(({ _id }) => !historyIds.has(_id))];
			}))
			.catch((requestError) => setError(requestError.message));

		return () => {
			socket.emit('typing', { groupId: room._id, isTyping: false });
			socket.disconnect();
			socketRef.current = null;
		};
	}, [room?._id, user?.id, user?.name]);

	const isOwner = String(room?.owner?._id || room?.owner || '') === String(user?.id || '');

	const deleteChat = async () => {
		if (!isOwner || !window.confirm(`Delete "${room?.name}"? This will permanently delete its messages.`)) return;

		setError('');
		setIsDeleting(true);
		try {
			const response = await fetch(`${API_URL}/groups/rooms/${room._id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
				},
				body: JSON.stringify({ userId: user?.id }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || 'Unable to delete group.');
			localStorage.removeItem(ROOM_KEY);
			window.location.hash = '#groups';
		} catch (requestError) {
			setError(requestError.message);
			setIsDeleting(false);
		}
	};

	const handleLogout = async () => {
		try {
			socketRef.current?.disconnect();
			await onLogout?.();
			localStorage.removeItem(ROOM_KEY);
			window.location.hash = '#login';
		} catch (logoutError) {
			setError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out.');
		}
	};

	useEffect(() => {
		if (!room?._id || !user?.id) return;
		fetch(`${API_URL}/groups/rooms/${room._id}?userId=${encodeURIComponent(user.id)}`, {
			headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
		})
			.then(async (response) => {
				const data = await response.json();
				if (!response.ok) throw new Error(data.message || 'Unable to load room members.');
				return data;
			})
			.then((freshRoom) => {
				setRoom(freshRoom);
				localStorage.setItem(ROOM_KEY, JSON.stringify(freshRoom));
			})
			.catch((requestError) => setError(requestError.message));
	}, [room?._id, user?.id]);

	async function handleSubmit(event) {
		event.preventDefault();
		const text = draft.trim();
		if (!text || !room?._id || isSending) return;
		setError('');
		socketRef.current?.emit('typing', { groupId: room._id, isTyping: false });
		setIsSending(true);
		try {
			const response = await fetch(`${API_URL}/groups/${room._id}/messages`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
				},
				body: JSON.stringify({ content: text, sender: user?.id }),
			});
			const message = await response.json();
			if (!response.ok) throw new Error(message.message || 'Unable to send message.');
			setDraft('');
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setIsSending(false);
		}

	}

	return (
		<main className="chat-page">
			<section className="chat-shell" aria-label="RealTime Chat">
				<aside className="chat-sidebar">
					<div className="group-heading">
						<div className="group-icon">RT</div>
						<div><h1>RealTime Chat</h1><p>{room?.name || 'Chat room'}</p></div>
					</div>
					<div className="section-label"><span>Members</span><span>{members.length}</span></div>
					<ul className="member-list">
						{members.map((member) => {
							const id = String(member._id || member.id);
							const name = member.name || 'Member';
							return <li className="member-item" key={id}>
								<Avatar name={name} color="#635bff" />
								<span className="member-details"><strong>{name}{id === String(user?.id) ? ' (You)' : ''}</strong><small>{onlineIds.includes(id) ? 'Online' : 'Offline'}</small></span>
								<i className={`status-dot${onlineIds.includes(id) ? ' status-dot--online' : ''}`} />
							</li>;
						})}
					</ul>
				</aside>

				<div className="chat-main">
					<header className="chat-header">
						<div><h2>{room?.name || 'Chat room'}</h2><p><i className="online-dot" /> Room code: {room?.roomCode || '—'}</p></div>
						<div className="chat-header-actions">
							<button className="more-button" type="button" aria-label="Chat options" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>•••</button>
							{isMenuOpen && (
								<div className="chat-menu">
									<button type="button" onClick={() => { setIsMenuOpen(false); window.location.hash = '#groups'; }}>Back to groups</button>
									{isOwner && <button className="chat-menu-delete" type="button" onClick={deleteChat} disabled={isDeleting}>Delete group</button>}
									<button className="chat-menu-logout" type="button" onClick={handleLogout}>Log out</button>
								</div>
							)}
						</div>
					</header>
					<div className="message-list">
						{error && <p role="alert">{error}</p>}
						<div className="date-divider"><span>Recent messages</span></div>
						{messages.map((message) => {
							const name = message.sender?.name || (message.sender === user?.id ? user?.name : 'Member');
							const own = message.sender?._id === user?.id || message.sender === user?.id;
							return <article className={`message-row${own ? ' own-message' : ''}`} key={message._id}>
								{!own && <Avatar name={name} color="#64748b" />}
								<div className="message-content">
									{!own && <strong>{name}</strong>}
									<div className="message-bubble">{message.content}</div>
									<time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
								</div>
							</article>;
						})}
						{typingLabel && <p className="typing-indicator" aria-live="polite">{typingLabel}</p>}
					</div>
					<form className="message-form" onSubmit={handleSubmit}>
						<button className="attach-button" type="button" aria-label="Attach file">＋</button>
						<input
							value={draft}
							onChange={(event) => {
								setDraft(event.target.value);
								socketRef.current?.emit('typing', { groupId: room?._id, isTyping: Boolean(event.target.value.trim()) });
							}}
							placeholder="Write a message..."
							aria-label="Message"
						/>
						<button className="send-button" type="submit" disabled={isSending}>Send</button>
					</form>
				</div>
			</section>
		</main>
	);
}
