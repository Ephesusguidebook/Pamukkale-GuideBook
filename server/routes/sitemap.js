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
  '/transfer/',
  '/blog/',
  '/destinations/',
  '/attraction/',
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

    const [departures, publishedTours, publishedPosts, publishedRoutes, publishedDestinations, publishedAttractions] = await Promise.all([
      db.tours.distinctDeparturePoints(),
      db.tours.listPublished(),
      db.blogPosts.listPublished(),
      db.transferRoutes.listPublished(),
      db.destinations.listPublished(),
      db.attractions.listPublished(),
    ]);

    departures.forEach((d) => entries.push(urlEntry(`${SITE_URL}/tours/from-${d.slug}/`)));
    publishedTours.forEach((t) => entries.push(urlEntry(`${SITE_URL}/tours/${t.slug}/`, t.updated_at)));
    publishedPosts.forEach((p) => entries.push(urlEntry(`${SITE_URL}/blog/${p.slug}/`, p.updated_at)));
    publishedRoutes.forEach((r) => entries.push(urlEntry(`${SITE_URL}/transfer/${r.slug}/`, r.updated_at)));
    publishedDestinations.forEach((d) => entries.push(urlEntry(`${SITE_URL}/destinations/${d.slug}/`, d.updated_at)));
    publishedAttractions.forEach((a) => entries.push(urlEntry(`${SITE_URL}/attraction/${a.slug}/`, a.updated_at)));

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries.join('\n') +
      `\n</urlset>`;

    res.type('application/xml').send(xml);
  })
);

module.exports = router;
