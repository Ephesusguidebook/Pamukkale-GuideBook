const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

module.exports = adminRouter(db.destinations, 'Destination not found.', 'destination');
