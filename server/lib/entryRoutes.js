const express = require('express');
const slugify = require('slugify');
const { requireAdmin } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('./asyncHandler');

// Shared route factory used by Tours and Blog Posts. Each content type still
// gets its own collection, its own API base path and its own admin screens —
// this just avoids re-typing the same CRUD wiring twice.

function publicRouter(collection, notFoundMessage) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await collection.listPublished());
    })
  );

  router.get(
    '/:slug',
    asyncHandler(async (req, res) => {
      const item = await collection.getPublishedBySlug(req.params.slug);
      if (!item) return res.status(404).json({ error: notFoundMessage });
      res.json(item);
    })
  );

  return router;
}

function adminRouter(collection, notFoundMessage, entityType, options = {}) {
  const router = express.Router();
  router.use(requireAdmin);
  const isSlugBlocked = options.isSlugBlocked || (() => false);

  async function logAction(req, action, item) {
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action,
      entity_type: entityType,
      entity_label: item?.title,
    });
  }

  async function uniqueSlug(title, ignoreId) {
    const rawBase = slugify(title, { lower: true, strict: true }) || 'item';
    // A blocked base (e.g. a reserved word, or — critically — anything
    // starting with "from-") can never be fixed by appending a numeric
    // suffix alone, since the block condition (an exact word match, or a
    // prefix match) would still hold for every "${base}-2", "${base}-3", ...
    // candidate, looping forever. Prepending instead of appending escapes
    // both kinds of block in one step.
    const base = isSlugBlocked(rawBase) ? `tour-${rawBase}` : rawBase;
    let slug = base;
    let i = 2;
    while ((await collection.slugExists(slug, ignoreId)) || isSlugBlocked(slug)) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await collection.listAll());
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = await collection.getById(req.params.id);
      if (!item) return res.status(404).json({ error: notFoundMessage });
      res.json(item);
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) {
        return res.status(400).json({ error: 'Title is required.' });
      }
      const slug = await uniqueSlug(b.title);
      const item = await collection.create({ ...b, slug });
      await logAction(req, 'create', item);
      res.status(201).json(item);
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const existing = await collection.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: notFoundMessage });

      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) {
        return res.status(400).json({ error: 'Title is required.' });
      }
      const slug = b.title !== existing.title ? await uniqueSlug(b.title, existing.id) : existing.slug;

      const item = await collection.update(existing.id, { ...b, slug });
      await logAction(req, 'update', item);
      res.json(item);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const existing = await collection.getById(req.params.id);
      const ok = await collection.remove(req.params.id);
      if (!ok) return res.status(404).json({ error: notFoundMessage });
      await logAction(req, 'delete', existing);
      res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { publicRouter, adminRouter };
