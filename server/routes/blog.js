const db = require('../db');
const { publicRouter } = require('../lib/entryRoutes');

module.exports = publicRouter(db.blogPosts, 'Blog post not found.');
