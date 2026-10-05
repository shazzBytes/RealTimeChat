const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true, minlength: 6 },
		googleId: { type: String, unique: true, sparse: true },
	},
	{ timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (user) =>
	jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'change-me', {
		expiresIn: '7d',
	});

router.post('/signup', async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password || password.length < 6) {
			return res.status(400).json({ message: 'Name, email, and a password of at least 6 characters are required' });
		}

		const normalizedEmail = email.toLowerCase().trim();
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

		const user = await User.create({
			name: name.trim(),
			email: normalizedEmail,
			password: await bcrypt.hash(password, 12),
		});

		return res.status(201).json({
			user: { id: user._id, name: user.name, email: user.email },
			token: createToken(user),
		});
	} catch (error) {
		if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered' });
		return res.status(500).json({ message: 'Unable to create account' });
	}
});

router.post('/signin', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email: email?.toLowerCase().trim() });

		if (!user || !password || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		return res.json({
			user: { id: user._id, name: user.name, email: user.email },
			token: createToken(user),
		});
	} catch (error) {
		return res.status(500).json({ message: 'Unable to sign in' });
	}
});

router.post('/google', async (req, res) => {
	try {
		const credential = req.body.credential || req.body.idToken;
		if (!credential || !process.env.GOOGLE_CLIENT_ID) {
			return res.status(400).json({ message: 'A Google credential is required' });
		}

		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		if (!payload?.sub || !payload.email || payload.email_verified !== true) {
			return res.status(401).json({ message: 'Invalid Google account' });
		}

		const email = payload.email.toLowerCase().trim();
		let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

		if (user) {
			if (!user.googleId) {
				user.googleId = payload.sub;
				await user.save();
			}
		} else {
			user = await User.create({
				name: payload.name || email.split('@')[0],
				email,
				googleId: payload.sub,
				password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
			});
		}

		return res.json({
			user: { id: user._id, name: user.name, email: user.email },
			token: createToken(user),
		});
	} catch (error) {
		return res.status(401).json({ message: 'Unable to authenticate with Google' });
	}
});

module.exports = router;
