const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');
const { adminRouter } = require('../lib/entryRoutes');

// Base CRUD (list/get/create/update/delete) reuses the same factory as
// Tours/Blog — transfer_routes has the same shape (slug/title/status).
const router = adminRouter(db.transferRoutes, 'Transfer route not found.', 'transfer_route');

// Availability sub-routes, mounted on the same router (requireAdmin is
// already applied by adminRouter above).
router.get(
  '/:id/availability',
  asyncHandler(async (req, res) => {
    const item = await db.transferRoutes.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Transfer route not found.' });
    const { from, to } = req.query;
    res.json(await db.availability.getForItem('transfer_route', item.id, { from, to }));
  })
);

router.put(
  '/:id/availability',
  asyncHandler(async (req, res) => {
    const item = await db.transferRoutes.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Transfer route not found.' });
    const { date, status } = req.body || {};
    if (!date) return res.status(400).json({ error: 'date is required.' });
    const result = await db.availability.setForItem('transfer_route', item.id, date, status);
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'update',
      entity_type: 'transfer_route_availability',
      entity_label: `${item.title} — ${date}: ${result.status}`,
    });
    res.json(result);
  })
);

module.exports = router;
