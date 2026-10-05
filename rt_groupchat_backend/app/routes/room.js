import { Router } from "express";

const router = Router();
const rooms = new Map();

const generateRoomCode = () =>
	Math.floor(100000 + Math.random() * 900000).toString();

router.post("/create", (req, res) => {
	let code;

	do {
		code = generateRoomCode();
	} while (rooms.has(code));

	rooms.set(code, { code, members: [] });

	res.status(201).json({ code });
});

router.post("/join", (req, res) => {
	const { code } = req.body;
	const room = rooms.get(code);

	if (!room) {
		return res.status(404).json({ message: "Room not found" });
	}

	res.status(200).json({ message: "Joined room", code: room.code });
});


export default router;
