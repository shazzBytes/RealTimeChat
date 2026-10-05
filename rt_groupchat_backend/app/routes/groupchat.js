const express = require("express");
const Message = require("../models/message");

const router = express.Router();

// send a message to a specific group
router.patch("/:groupId/messages", async (req, res) => {
	try {
		const message = await Message.create({
			...req.body,
			groupId: req.params.groupId,
		});

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
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		res.json(messages.reverse());
	} catch (error) {
		res.status(500).json({ message: "Unable to fetch group messages" });
	}
});


module.exports = router;
