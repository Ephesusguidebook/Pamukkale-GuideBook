const db = require('../db');
const asyncHandler = require('./asyncHandler');

// Shared availability sub-routes, reused by Transfer and Tours (both use the
// same generic `availability` table — item_type/item_id/date, see db.js's
// `availability` object and AvailabilityCalendar.jsx on the client). Each
// caller passes its own itemType partition key (e.g. 'transfer_route',
// 'tour') and the collection whose getById/getPublishedBySlug it should use.

// Attaches GET /:slug/availability (public, read-only) to an existing
// public router built by entryRoutes.publicRouter() (or an equivalent
// hand-rolled router with a GET /:slug already registered).
function attachPublicAvailability(router, { itemType, collection, notFoundMessage }) {
  router.get(
    '/:slug/availability',
    asyncHandler(async (req, res) => {
      const item = await collection.getPublishedBySlug(req.params.slug);
      if (!item) return res.status(404).json({ error: notFoundMessage });
      const { from, to } = req.query;
      res.json(await db.availability.getForItem(itemType, item.id, { from, to }));
    })
  );
}

// Attaches GET + PUT /:id/availability (admin) to an existing admin router
// built by entryRoutes.adminRouter() (requireAdmin is already applied there).
function attachAdminAvailability(router, { itemType, collection, notFoundMessage }) {
  router.get(
    '/:id/availability',
    asyncHandler(async (req, res) => {
      const item = await collection.getById(req.params.id);
      if (!item) return res.status(404).json({ error: notFoundMessage });
      const { from, to } = req.query;
      res.json(await db.availability.getForItem(itemType, item.id, { from, to }));
    })
  );

  router.put(
    '/:id/availability',
    asyncHandler(async (req, res) => {
      const item = await collection.getById(req.params.id);
      if (!item) return res.status(404).json({ error: notFoundMessage });
      const { date, status } = req.body || {};
      if (!date) return res.status(400).json({ error: 'date is required.' });
      const result = await db.availability.setForItem(itemType, item.id, date, status);
      await db.adminLogs.create({
        admin_email: req.admin?.email,
        action: 'update',
        entity_type: `${itemType}_availability`,
        entity_label: `${item.title} — ${date}: ${result.status}`,
      });
      res.json(result);
    })
  );
}

module.exports = { attachPublicAvailability, attachAdminAvailability };
