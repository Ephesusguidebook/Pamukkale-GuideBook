const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// GET /api/page-content - public, editable H1/paragraph copy for every page
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await db.pageContent.get());
  })
);

module.exports = router;
