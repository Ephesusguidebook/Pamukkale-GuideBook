const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/page-content - public, editable H1/paragraph copy for every page
router.get('/', (req, res) => {
  res.json(db.pageContent.get());
});

module.exports = router;
