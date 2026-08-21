const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// GET /robots.txt - public, editable from Admin > Site Files
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const files = await db.siteFiles.get();
    res.type('text/plain').send(files.robots_txt);
  })
);

module.exports = router;
