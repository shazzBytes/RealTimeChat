# RealTimeChat

RealTimeChat is a React and Node.js group chat application. Users can create or join rooms with six-digit room codes, exchange messages in real time, see member presence, and receive typing indicators.

## Features

- Email/password sign-up and sign-in.
- MongoDB-backed users, groups, and messages.
- Six-digit room-code creation and joining.
- Persistent chat history with the latest 50 messages loaded when a room opens.
- Real-time message delivery with Socket.IO.
- Online/offline member presence.
- Live typing indicators.
- Owner-only group deletion, including deletion of the group's messages.
- Copy-to-clipboard support for newly created room codes.

## Architecture

```text
rt_groupchat_backend/   Express, MongoDB, REST API, Socket.IO server
rt_groupchat_frontend/  React and Vite client
```

The frontend uses REST requests for authentication, room operations, message persistence, and history loading. Socket.IO provides live messages, presence, typing, and room deletion updates.

## Prerequisites

- Node.js 18 or newer.
- npm.
- A running MongoDB instance.

## Setup

### 1. Start the backend

```powershell
cd rt_groupchat_backend
npm install
```

Create `rt_groupchat_backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/rt_groupchat
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Start the API:

```powershell
npm run dev
```

### 2. Start the frontend

```powershell
cd rt_groupchat_frontend
npm install
```

Create `rt_groupchat_frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:

```powershell
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

## Validation

Run the frontend checks from `rt_groupchat_frontend`:

```powershell
npm run lint
npm run build
```

Run the backend syntax checks from `rt_groupchat_backend`:

```powershell
node --check app\app.js
node --check app\routes\auth.js
node --check app\routes\groupchat.js
```

## Documentation

- [Backend README](./rt_groupchat_backend/README.md)
- [Frontend README](./rt_groupchat_frontend/README.md)

## Security notes

- Do not commit `.env` files or real credentials.
- Use a long, random `JWT_SECRET` outside local development.
