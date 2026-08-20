const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

module.exports = adminRouter(db.dailyTours, 'Daily tour not found.', 'daily_tour');
