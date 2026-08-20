const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
router.use(requireAdmin);

router.get('/', (req, res) => {
  res.json(db.redirects.listAll());
});

router.post('/', (req, res) => {
  try {
    const redirect = db.redirects.create(req.body || {});
    res.status(201).json(redirect);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create redirect.' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const redirect = db.redirects.update(req.params.id, req.body || {});
    if (!redirect) return res.status(404).json({ error: 'Redirect not found.' });
    res.json(redirect);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not update redirect.' });
  }
});

router.delete('/:id', (req, res) => {
  const ok = db.redirects.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Redirect not found.' });
  res.json({ ok: true });
});

module.exports = router;
