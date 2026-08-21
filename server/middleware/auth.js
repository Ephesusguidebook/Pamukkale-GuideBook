const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // An admin token never carries a role claim (see routes/auth.js) — an
    // agency token does (role: 'agency', see routes/agencyAuth.js). Reject
    // it explicitly here, otherwise any validly-signed agency token would
    // also pass as an admin token since both share the same JWT_SECRET.
    if (payload.role) {
      return res.status(401).json({ error: 'Session invalid or expired.' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalid or expired.' });
  }
}

// Agency portal auth — a separate realm from requireAdmin above. An agency
// JWT carries role: 'agency', so an admin token (which has no role field)
// can never be replayed against an /api/agency route and vice versa.
function requireAgency(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'agency') {
      return res.status(401).json({ error: 'Session invalid or expired.' });
    }
    req.agency = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalid or expired.' });
  }
}

module.exports = { requireAdmin, requireAgency, JWT_SECRET };
