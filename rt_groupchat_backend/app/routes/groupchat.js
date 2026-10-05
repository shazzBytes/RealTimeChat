const express = require("express");
const crypto = require("crypto");
const Group = require("../models/group");
const Message = require("../models/message");

const router = express.Router();

const createRoomCode = () => crypto.randomInt(100000, 1000000).toString();

router.post("/rooms", async (req, res) => {
	try {
		const { name, description, owner } = req.body;
		if (!name?.trim() || !owner) {
			return res.status(400).json({ message: "A room name and signed-in user are required" });
		}

		let roomCode;
		do {
			roomCode = createRoomCode();
		} while (await Group.exists({ roomCode }));

		const group = await Group.create({
			name: name.trim(),
			description: description?.trim(),
			roomCode,
			owner,
			members: [owner],
		});

		res.status(201).json(await group.populate("members", "name email"));
	} catch (error) {
		res.status(400).json({ message: "Unable to create room" });
	}
});

router.post("/rooms/join", async (req, res) => {
	try {
		const { code, userId } = req.body;
		if (!code?.trim() || !userId) {
			return res.status(400).json({ message: "A room code and signed-in user are required" });
		}

		const group = await Group.findOneAndUpdate(
			{ roomCode: code?.trim() },
			{ $addToSet: { members: userId } },
			{ new: true }
		);

		if (!group) {
			return res.status(404).json({ message: "Room not found" });
		}

		res.json(await group.populate("members", "name email"));
	} catch (error) {
		res.status(400).json({ message: "Unable to join room" });
	}
});

router.get("/rooms", async (req, res) => {
	try {
		if (!req.query.userId) {
			return res.status(400).json({ message: "A signed-in user is required" });
		}

		const groups = await Group.find({
			$or: [{ owner: req.query.userId }, { members: req.query.userId }],
		}).populate("members", "name email").sort({ createdAt: -1 }).lean();
		res.json(groups);
	} catch (error) {
		res.status(500).json({ message: "Unable to fetch rooms" });
	}
});

router.delete("/rooms/:groupId", async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) {
			return res.status(400).json({ message: "A signed-in user is required" });
		}

		const group = await Group.findOneAndDelete({
			_id: req.params.groupId,
			owner: userId,
		});

		if (!group) {
			return res.status(404).json({ message: "Room not found or you are not the owner" });
		}

		await Message.deleteMany({ groupId: req.params.groupId });
		req.app.get("io")?.to(req.params.groupId).emit("groupDeleted", {
			groupId: req.params.groupId,
		});

		res.json({ message: "Room deleted" });
	} catch (error) {
		res.status(500).json({ message: "Unable to delete room" });
	}
});

router.get("/rooms/:groupId", async (req, res) => {
	try {
		if (!req.query.userId) {
			return res.status(400).json({ message: "A signed-in user is required" });
		}

		const group = await Group.findOne({
			_id: req.params.groupId,
			$or: [{ owner: req.query.userId }, { members: req.query.userId }],
		}).populate("members", "name email");

		if (!group) {
			return res.status(404).json({ message: "Room not found" });
		}

		res.json(group);
	} catch (error) {
		res.status(500).json({ message: "Unable to fetch room members" });
	}
});

// send a message to a specific group
router.patch("/:groupId/messages", async (req, res) => {
	try {
		const message = await Message.create({
			...req.body,
			groupId: req.params.groupId,
		});
		await message.populate("sender", "name");

		const io = req.app.get("io");
		io?.to(req.params.groupId).emit("groupMessage", message);

		res.status(201).json(message);
	} catch (error) {
		res.status(400).json({ message: "Unable to send group message" });
	}
});

// fetch messages for a specific group
router.get("/:groupId/messages", async (req, res) => {
	try {
		const messages = await Message.find({ groupId: req.params.groupId })
			.populate("sender", "name")
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		res.json(messages.reverse());
	} catch (error) {
		res.status(500).json({ message: "Unable to fetch group messages" });
	}
});


module.exports = router;
