const db = require('../db');
const { publicRouter } = require('../lib/entryRoutes');

module.exports = publicRouter(db.dailyTours, 'Daily tour not found.');
