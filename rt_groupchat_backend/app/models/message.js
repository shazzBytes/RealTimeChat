const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		groupId: {
			type: String,
			required: true,
			index: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		readBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
