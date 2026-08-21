const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');
const { attachAdminAvailability } = require('../lib/availabilityRoutes');

// Base CRUD (list/get/create/update/delete) reuses the same factory as
// Tours/Blog — transfer_routes has the same shape (slug/title/status).
const router = adminRouter(db.transferRoutes, 'Transfer route not found.', 'transfer_route');

// Availability sub-routes, mounted on the same router (requireAdmin is
// already applied by adminRouter above).
attachAdminAvailability(router, {
  itemType: 'transfer_route',
  collection: db.transferRoutes,
  notFoundMessage: 'Transfer route not found.',
});

module.exports = router;
