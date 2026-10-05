# RealTimeChat frontend

The frontend is a React single-page application built with Vite. It provides authentication, room creation and joining, persistent chat history, real-time messaging, member presence, typing indicators, and room management.

## Stack

- React
- Vite
- Socket.IO Client
- ESLint

## Setup

```powershell
npm install
```

Create `.env` in this directory:

```env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` points to the backend.

## Run

Start the development server:

```powershell
npm run dev
```

Create a production build:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

Run ESLint:

```powershell
npm run lint
```

## User flow

1. Sign in or create an account with email and password.
2. Create a room to receive a unique six-digit room code, or join an existing room with a code.
3. Copy a newly created room code with the **Copy code** button.
4. Open a room to load its latest 50 messages from the backend.
5. Send messages, see new messages instantly, and view online/offline members.
6. See typing indicators while other members compose messages.
7. Room owners can delete a room from the room-card options menu or the chat header menu.
8. Log out from the groups page or the chat options menu.

## Real-time behavior

The chat connects to the backend with Socket.IO when a room is opened. It joins the selected group and listens for:

- `groupMessage` for persisted messages broadcast to the room.
- `roomPresence` for online users and typing users.
- `groupDeleted` when an owner removes the room.

The frontend sends:

- `joinGroup` when entering a room.
- `typing` as the message input changes.

The HTTP API is still used to persist messages and load message history. Socket.IO provides the immediate update to other connected users.

## Source structure

```text
src/
├── components/
├── hooks/
│   └── useAuth.js
├── pages/
│   ├── Chat.jsx
│   ├── Groups.jsx
│   ├── Login.jsx
│   └── Signup.jsx
└── App.jsx
```

See the [project README](../README.md) for full-stack setup and the [backend README](../rt_groupchat_backend/README.md) for API and Socket.IO details.
