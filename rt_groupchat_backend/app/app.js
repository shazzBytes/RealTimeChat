const cors = require("cors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const groupchatRoutes = require("./routes/groupchat");


const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 5000;
const io = new Server(server, {
	cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" },
});
const roomPresence = new Map();
const roomTyping = new Map();

const emitRoomState = (roomId) => {
	io.to(roomId).emit("roomPresence", {
		online: [...(roomPresence.get(roomId)?.values() ?? [])],
		typing: [...(roomTyping.get(roomId)?.values() ?? [])],
	});
};

io.on("connection", (socket) => {
	socket.on("joinGroup", ({ groupId, user }) => {
		if (!groupId || !user?.id) return;
		const userId = String(user.id);
		socket.join(groupId);
		socket.data.groupId = groupId;
		socket.data.user = { id: userId, name: user.name || "Member" };
		if (!roomPresence.has(groupId)) roomPresence.set(groupId, new Map());
		roomPresence.get(groupId).set(userId, socket.data.user);
		emitRoomState(groupId);
	});

	socket.on("typing", ({ groupId, isTyping }) => {
		const user = socket.data.user;
		if (!groupId || !user) return;
		if (!roomTyping.has(groupId)) roomTyping.set(groupId, new Map());
		if (isTyping) roomTyping.get(groupId).set(String(user.id), user);
		else roomTyping.get(groupId).delete(String(user.id));
		emitRoomState(groupId);
	});

	socket.on("disconnect", () => {
		const { groupId, user } = socket.data;
		if (!groupId || !user) return;
		roomPresence.get(groupId)?.delete(String(user.id));
		roomTyping.get(groupId)?.delete(String(user.id));
		emitRoomState(groupId);
	});
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.set("io", io);
app.use("/auth", authRoutes);
app.use("/groups", groupchatRoutes);

app.get("/health", (_request, response) => {
	response.json({ status: "ok" });
});

connectDB().then(() => {
	server.listen(port, () => {
		console.log(`Backend listening on port ${port}`);
	});
});
