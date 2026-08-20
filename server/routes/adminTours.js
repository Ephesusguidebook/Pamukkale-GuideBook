const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

// A tour's slug can never equal a /tours URL filter keyword (package, daily,
// activities) or start with "from-" (the departure-filter prefix) — it
// would make that tour indistinguishable from a filter page.
module.exports = adminRouter(db.tours, 'Tour not found.', 'tour', {
  isSlugBlocked: (slug) => db.isReservedTourSlug(slug),
});
