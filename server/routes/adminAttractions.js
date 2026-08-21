const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

module.exports = adminRouter(db.attractions, 'Attraction not found.', 'attraction');
