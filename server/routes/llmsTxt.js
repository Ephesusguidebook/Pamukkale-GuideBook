const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /llms.txt - public, editable from Admin > Site Files
router.get('/', (req, res) => {
  res.type('text/plain').send(db.siteFiles.get().llms_txt);
});

module.exports = router;
