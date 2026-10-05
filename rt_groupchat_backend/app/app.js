const cors = require("cors");
const express = require("express");

require("dotenv").config();

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const groupchatRoutes = require("./routes/groupchat");


const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/health", (_request, response) => {
	response.json({ status: "ok" });
});

connectDB().then(() => {
	app.listen(port, () => {
		console.log(`Backend listening on port ${port}`);
	});
});
