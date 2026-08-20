const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /robots.txt - public, editable from Admin > Site Files
router.get('/', (req, res) => {
  res.type('text/plain').send(db.siteFiles.get().robots_txt);
});

module.exports = router;
