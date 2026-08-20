const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

module.exports = adminRouter(db.activities, 'Activity not found.', 'activity');
