const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');
const { attachAdminAvailability } = require('../lib/availabilityRoutes');

// A tour's slug can never equal a /tours URL filter keyword (package, daily,
// activities) or start with "from-" (the departure-filter prefix) — it
// would make that tour indistinguishable from a filter page.
const router = adminRouter(db.tours, 'Tour not found.', 'tour', {
  isSlugBlocked: (slug) => db.isReservedTourSlug(slug),
});

// Faz 3 — availability sub-routes (Private and Small Group tours both use
// the same generic availability table Transfer already uses; requireAdmin
// is already applied by adminRouter above).
attachAdminAvailability(router, {
  itemType: 'tour',
  collection: db.tours,
  notFoundMessage: 'Tour not found.',
});

module.exports = router;
