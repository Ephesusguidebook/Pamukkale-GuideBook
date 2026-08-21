const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAdmin } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAdmin);

// All converted media files live in one flat directory on disk — folders are
// purely a metadata/organizational concept in the database, so there is no
// path-traversal risk from folder names.
const mediaDir = path.join(__dirname, '..', 'uploads', 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function parseFolderId(raw) {
  if (raw === undefined || raw === null || raw === '' || raw === 'root') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// --- Folders ---

router.get(
  '/folders',
  asyncHandler(async (req, res) => {
    res.json(await db.mediaFolders.listAll());
  })
);

router.post(
  '/folders',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Folder name is required.' });
    const parentId = parseFolderId(req.body.parent_id);
    if (parentId && !(await db.mediaFolders.getById(parentId))) {
      return res.status(400).json({ error: 'Parent folder not found.' });
    }
    const folder = await db.mediaFolders.create({ name, parent_id: parentId });
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'create',
      entity_type: 'media_folder',
      entity_label: folder.name,
    });
    res.status(201).json(folder);
  })
);

router.delete(
  '/folders/:id',
  asyncHandler(async (req, res) => {
    const existing = await db.mediaFolders.getById(req.params.id);
    const ok = await db.mediaFolders.remove(req.params.id);
    if (!ok) {
      return res
        .status(400)
        .json({ error: 'Folder not found, or it still contains subfolders/photos.' });
    }
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'delete',
      entity_type: 'media_folder',
      entity_label: existing?.name,
    });
    res.json({ ok: true });
  })
);

// --- Items ---

router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const folderId = parseFolderId(req.query.folder_id);
    res.json(await db.mediaItems.listByFolder(folderId));
  })
);

router.post(
  '/upload',
  upload.array('files', 30),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    const folderId = parseFolderId(req.body.folder_id);
    if (folderId && !(await db.mediaFolders.getById(folderId))) {
      return res.status(400).json({ error: 'Folder not found.' });
    }

    const items = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const name = crypto.randomBytes(16).toString('hex');
        let filename;
        let buffer;
        let metadata = {};

        // Convert every upload to WebP automatically. If the file isn't a
        // format sharp can read (or conversion otherwise fails), fall back to
        // storing the original bytes so the upload still succeeds.
        try {
          buffer = await sharp(file.buffer).rotate().webp({ quality: 82 }).toBuffer();
          filename = `${name}.webp`;
          metadata = await sharp(buffer).metadata();
        } catch {
          const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
          filename = `${name}${ext}`;
          buffer = file.buffer;
        }

        fs.writeFileSync(path.join(mediaDir, filename), buffer);

        const item = await db.mediaItems.create({
          url: `/uploads/media/${filename}`,
          filename,
          original_name: file.originalname,
          folder_id: folderId,
          size: buffer.length,
          width: metadata.width || null,
          height: metadata.height || null,
        });
        items.push(item);
      } catch (err) {
        errors.push(`${file.originalname}: ${err.message || 'upload failed'}`);
      }
    }

    if (items.length) {
      await db.adminLogs.create({
        admin_email: req.admin?.email,
        action: 'create',
        entity_type: 'media',
        entity_label: `Uploaded ${items.length} photo${items.length === 1 ? '' : 's'}`,
      });
    }
    res.status(items.length ? 201 : 500).json({ items, errors });
  })
);

router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const item = await db.mediaItems.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found.' });
    await db.mediaItems.remove(req.params.id);
    fs.unlink(path.join(mediaDir, item.filename), () => {});
    await db.adminLogs.create({
      admin_email: req.admin?.email,
      action: 'delete',
      entity_type: 'media',
      entity_label: item.original_name || item.filename,
    });
    res.json({ ok: true });
  })
);

module.exports = router;
