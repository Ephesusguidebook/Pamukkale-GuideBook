const db = require('../db');
const { adminRouter } = require('../lib/entryRoutes');

module.exports = adminRouter(db.packageTours, 'Package tour not found.', 'package_tour');
