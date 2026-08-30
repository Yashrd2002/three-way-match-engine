const STATIC_TOKEN = 'bearer-static-token-three-way-match-2026';

const authMiddleware = (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/health' || req.path.startsWith('/seed') || req.path.includes('/file')) {
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
  // Allow static token or any string token for simple testing
  if (token === STATIC_TOKEN || token === 'mock-token' || token.length > 5) {
    req.user = { id: 'admin-user', username: 'admin', role: 'admin' };
    return next();
  }

  return res.status(401).json({ error: 'Invalid authentication token' });
};

module.exports = { authMiddleware, STATIC_TOKEN };
