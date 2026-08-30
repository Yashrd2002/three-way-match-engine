const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, STATIC_TOKEN } = require('../config/auth');

// POST /auth/signup (or /auth/register)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required for registration' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const newUser = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password: String(password),
      role: role || 'admin'
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('[Signup Error]', err);
    return res.status(500).json({ error: 'Server error during user registration', details: err.message });
  }
});

// Alias for signup
router.post('/register', (req, res) => {
  return router.handle(req, res);
});

// POST /auth/login (or /auth/signin)
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const inputEmail = (email || username || '').trim().toLowerCase();

    if (!inputEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try finding in database
    let user = await User.findOne({ email: inputEmail });

    // If default demo credentials or first login, auto-create default admin account
    if (!user && (inputEmail === 'admin' || inputEmail === 'admin@match.com' || inputEmail.includes('@'))) {
      user = await User.create({
        name: 'Procurement Admin',
        email: inputEmail.includes('@') ? inputEmail : 'admin@match.com',
        password: password,
        role: 'admin'
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// Alias for signin
router.post('/signin', (req, res) => {
  return router.handle(req, res);
});

// GET /auth/me - Get current user profile
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
