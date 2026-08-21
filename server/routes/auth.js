const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await db.adminUsers.findByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    await db.adminLogs.create({ admin_email: user.email, action: 'login', entity_type: 'auth' });
    res.json({ token, email: user.email });
  })
);

// Checks whether the token is still valid (used on admin panel load).
router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.admin.email });
});

module.exports = router;
