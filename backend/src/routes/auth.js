const express = require('express');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// Simple name-based login — no OAuth needed
router.post('/login', async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    let user = await User.findOne({ googleId: userId });
    if (!user) {
      user = await User.create({
        googleId: userId,
        name: name.trim(),
        email: `${userId}@tambola.local`,
        avatar,
      });
    } else {
      user.name = name.trim();
      user.avatar = avatar;
      await user.save();
    }

    const token = signToken({
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
