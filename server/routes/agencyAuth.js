const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAgency } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// POST /api/agency/auth/login - agency accounts are only ever created by
// the admin (Admin > Agencies), never public self-signup.
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const agency = await db.agencies.findByEmailRaw(email);
    if (!agency || !bcrypt.compareSync(password, agency.password_hash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    if (agency.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended. Please contact us.' });
    }

    const token = jwt.sign({ sub: agency.id, email: agency.email, role: 'agency' }, JWT_SECRET, {
      expiresIn: '7d',
    });
    await db.agencies.touchLogin(agency.id);
    res.json({ token, email: agency.email, company_name: agency.company_name });
  })
);

// GET /api/agency/auth/me - session check + the data every agency portal
// page needs (profile fields, effective markup rate).
router.get(
  '/me',
  requireAgency,
  asyncHandler(async (req, res) => {
    const agency = await db.agencies.getById(req.agency.sub);
    if (!agency || agency.status === 'suspended') {
      return res.status(401).json({ error: 'Session invalid or expired.' });
    }
    const effective_markup_percent = await db.agencies.effectiveMarkupPercent(agency);
    res.json({ ...agency, effective_markup_percent });
  })
);

// POST /api/agency/auth/change-password - self-service password change.
router.post(
  '/change-password',
  requireAgency,
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    const raw = await db.agencies.findByIdRaw(req.agency.sub);
    if (!raw || !bcrypt.compareSync(current_password, raw.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    await db.agencies.setPassword(raw.id, new_password);
    res.json({ ok: true });
  })
);

module.exports = router;
