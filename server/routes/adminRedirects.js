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
    db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'create',
      entity_type: 'redirect',
      entity_label: `${redirect.from_path} → ${redirect.to_path}`,
    });
    res.status(201).json(redirect);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create redirect.' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const redirect = db.redirects.update(req.params.id, req.body || {});
    if (!redirect) return res.status(404).json({ error: 'Redirect not found.' });
    db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'update',
      entity_type: 'redirect',
      entity_label: `${redirect.from_path} → ${redirect.to_path}`,
    });
    res.json(redirect);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not update redirect.' });
  }
});

router.delete('/:id', (req, res) => {
  const existing = db.redirects.getById(req.params.id);
  const ok = db.redirects.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Redirect not found.' });
  db.adminLogs.create({
    admin_email: req.admin?.email,
    action: 'delete',
    entity_type: 'redirect',
    entity_label: existing ? `${existing.from_path} → ${existing.to_path}` : undefined,
  });
  res.json({ ok: true });
});

module.exports = router;
