const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

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

router.post('/logout', (_req, res) => {
	res.json({ message: 'Signed out successfully' });
});

module.exports = router;
