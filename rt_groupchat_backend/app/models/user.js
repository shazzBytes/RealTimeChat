const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true, minlength: 6 },
		googleId: { type: String, unique: true, sparse: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
