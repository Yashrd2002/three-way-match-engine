const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'three-way-match-jwt-secret-key-2026';
const STATIC_TOKEN = 'bearer-static-token-three-way-match-2026';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const authMiddleware = async (req, res, next) => {
  const openPaths = ['/auth/login', '/auth/signup', '/auth/register', '/health', '/seed'];
  if (openPaths.includes(req.path) || req.path.includes('/file')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed authorization token header' });
  }

  const token = parts[1];

  // Static token fallback for demo / seeding
  if (token === STATIC_TOKEN || token === 'mock-token') {
    req.user = { id: 'usr_admin_01', email: 'admin@match.com', name: 'Procurement Admin', role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token. Please sign in again.' });
  }
};

module.exports = { authMiddleware, generateToken, JWT_SECRET, STATIC_TOKEN };
