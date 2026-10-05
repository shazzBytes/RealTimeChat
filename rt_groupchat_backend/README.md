# RealTimeChat backend

The backend is an Express application connected to MongoDB. It provides authentication, room management, message history, persistent message creation, and Socket.IO real-time events.

## Stack

- Node.js
- Express
- Mongoose
- MongoDB
- Socket.IO
- JSON Web Tokens

## Setup

```powershell
npm install
```

Create `.env` in this directory:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/rt_groupchat
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```

`MONGODB_URI` defaults to the local `rt_groupchat` database and `PORT` defaults to `5000` when omitted.

## Run

```powershell
npm run dev
```

For a normal start without file watching:

```powershell
npm start
```

The health endpoint is available at `GET /health`.

## Project structure

```text
app/
├── app.js                  Express and Socket.IO server
├── db.js                   MongoDB connection
├── models/
│   ├── group.js
│   ├── message.js
│   └── user.js
└── routes/
    ├── auth.js
    ├── groupchat.js
    └── room.js              Legacy, not mounted by app.js
```

## REST API

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create an account with name, email, and password. |
| `POST` | `/auth/signin` | Sign in with email and password. |
| `POST` | `/auth/logout` | Complete the client logout flow with a success response. |

Authentication responses include a JWT and a user object. The current routes receive user IDs from the client; production deployments should add server-side JWT authentication middleware before exposing protected operations.

Logout is client-session based: the frontend clears the stored JWT and user data. The backend endpoint does not maintain a token blacklist.

### Rooms

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/groups/rooms` | Create a room and generate a unique six-digit room code. |
| `POST` | `/groups/rooms/join` | Join a room using its code. |
| `GET` | `/groups/rooms?userId=<id>` | List rooms owned by or joined by a user. |
| `GET` | `/groups/rooms/:groupId?userId=<id>` | Load a room and its populated members. |
| `DELETE` | `/groups/rooms/:groupId` | Delete a room and its messages; owner-only. |

Room creation expects `name`, `description` (optional), and `owner`. Joining expects `code` and `userId`. Deletion expects `userId` in the request body.

### Messages

| Method | Endpoint | Description |
| --- | --- | --- |
| `PATCH` | `/groups/:groupId/messages` | Persist a message and broadcast it to the room. |
| `GET` | `/groups/:groupId/messages` | Return the latest 50 messages in chronological display order. |

Messages are stored in MongoDB before the `groupMessage` Socket.IO event is emitted.

## Socket.IO events

The server accepts connections from `FRONTEND_URL`.

### Client to server

`joinGroup`

```js
socket.emit("joinGroup", {
  groupId,
  user: { id, name },
});
```

Adds the socket to the room and marks the user online.

`typing`

```js
socket.emit("typing", {
  groupId,
  isTyping: true,
});
```

Set `isTyping` to `false` when the input is empty, the message is sent, or the user leaves.

### Server to client

`groupMessage`

Emitted to every socket in the group after a message is stored.

`roomPresence`

```js
{
  online: [{ id, name }],
  typing: [{ id, name }]
}
```

Emitted when users connect, disconnect, or change typing state.

`groupDeleted`

```js
{ groupId }
```

Emitted when an owner deletes a room.

Presence and typing state are held in server memory and reset when the backend restarts. Messages remain persistent in MongoDB.
