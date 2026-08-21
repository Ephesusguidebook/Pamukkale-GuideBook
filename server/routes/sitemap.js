const express = require('express');
const db = require('../db');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || 'http://localhost:4000').replace(/\/$/, '');

const STATIC_PATHS = [
  '/',
  '/tours/',
  '/tours/package/',
  '/tours/daily/',
  '/tours/activities/',
  '/blog/',
  '/about-us/',
  '/contact/',
  '/faq/',
  '/terms-and-conditions/',
  '/privacy-policy/',
];

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${loc}</loc>${
    lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''
  }\n  </url>`;
}

// GET /sitemap.xml - regenerated on every request from whatever is
// currently published, so it's always in sync with the admin panel.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = [];

    STATIC_PATHS.forEach((p) => entries.push(urlEntry(`${SITE_URL}${p}`)));

    const [departures, publishedTours, publishedPosts] = await Promise.all([
      db.tours.distinctDeparturePoints(),
      db.tours.listPublished(),
      db.blogPosts.listPublished(),
    ]);

    departures.forEach((d) => entries.push(urlEntry(`${SITE_URL}/tours/from-${d.slug}/`)));
    publishedTours.forEach((t) => entries.push(urlEntry(`${SITE_URL}/tours/${t.slug}/`, t.updated_at)));
    publishedPosts.forEach((p) => entries.push(urlEntry(`${SITE_URL}/blog/${p.slug}/`, p.updated_at)));

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries.join('\n') +
      `\n</urlset>`;

    res.type('application/xml').send(xml);
  })
);

module.exports = router;
