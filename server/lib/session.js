const crypto = require('crypto');

const COOKIE_NAME = 'trr_sid';

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  });
  return out;
}

// Reads the visitor's session id from their cookie, or issues a new one.
// Used to group client-side pageview pings into sessions ("pages per
// session") without any personal data — just a random id.
function getOrSetSessionId(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let sid = cookies[COOKIE_NAME];
  if (!sid) {
    sid = crypto.randomUUID();
    res.cookie(COOKIE_NAME, sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
  return sid;
}

module.exports = { getOrSetSessionId, COOKIE_NAME };
