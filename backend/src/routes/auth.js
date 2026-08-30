const express = require('express');
const router = express.Router();
const { STATIC_TOKEN } = require('../config/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  
  // Basic validation - accepts any non-empty input or defaults
  const user = {
    id: 'usr_admin_01',
    username: username || 'admin',
    name: 'Procurement Manager',
    role: 'admin'
  };

  return res.json({
    token: STATIC_TOKEN,
    user
  });
});

module.exports = router;
