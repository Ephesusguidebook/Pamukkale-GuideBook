require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const toursRouter = require('./routes/tours');
const adminToursRouter = require('./routes/adminTours');
const transferRoutesRouter = require('./routes/transferRoutes');
const adminTransferRoutesRouter = require('./routes/adminTransferRoutes');
const blogRouter = require('./routes/blog');
const adminBlogRouter = require('./routes/adminBlog');
const destinationsRouter = require('./routes/destinations');
const adminDestinationsRouter = require('./routes/adminDestinations');
const attractionsRouter = require('./routes/attractions');
const adminAttractionsRouter = require('./routes/adminAttractions');
const adminMediaRouter = require('./routes/adminMedia');
const adminRedirectsRouter = require('./routes/adminRedirects');
const adminLogsRouter = require('./routes/adminLogs');
const trackRouter = require('./routes/track');
const authRouter = require('./routes/auth');
const db = require('./db');
const contactRouter = require('./routes/contact');
const settingsRouter = require('./routes/settings');
const pageContentRouter = require('./routes/pageContent');
const adminPageContentRouter = require('./routes/adminPageContent');
const sitemapRouter = require('./routes/sitemap');
const llmsTxtRouter = require('./routes/llmsTxt');
const robotsTxtRouter = require('./routes/robotsTxt');
const adminSiteFilesRouter = require('./routes/adminSiteFiles');
const { detectBot } = require('./lib/botDetect');
const { getOrSetSessionId } = require('./lib/session');

const app = express();
const PORT = process.env.PORT || 4000;

// Static assets we don't want cluttering the traffic log (page-level
// requests only — the log exists to show real pages/crawl activity, not
// every JS/CSS/image fetch).
const STATIC_ASSET_RE = /\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|map|woff2?|ttf|eot)$/i;
function isLoggablePath(pathname) {
  if (pathname.startsWith('/api') || pathname.startsWith('/uploads') || pathname.startsWith('/assets')) {
    return false;
  }
  return !STATIC_ASSET_RE.test(pathname);
}

// Blog detail pages, plus the fixed static pages — used so a bot/visitor
// hitting a genuinely unknown or deleted URL gets a real 404 status (both
// for accurate crawl-error reporting and for SEO), instead of always
// answering 200 like a typical bare SPA catch-all would.
const STATIC_PAGE_PATHS = new Set([
  '/',
  '/tours',
  '/transfer',
  '/blog',
  '/destinations',
  '/attraction',
  '/about-us',
  '/contact',
  '/terms-and-conditions',
  '/privacy-policy',
  '/faq',
]);
const DETAIL_PREFIXES = [
  { prefix: '/blog/', collection: () => db.blogPosts },
  { prefix: '/transfer/', collection: () => db.transferRoutes },
  { prefix: '/destinations/', collection: () => db.destinations },
  { prefix: '/attraction/', collection: () => db.attractions },
];

// /tours URL scheme: /tours, /tours/:type, /tours/from-:departure,
// /tours/:type/from-:departure (combinable, either order), /tours/:slug —
// classifies a single path segment as a type filter, a departure filter, or
// (if neither) a candidate tour detail slug. Kept in sync with the
// equivalent client-side logic in client/src/lib/tourRouting.js.
const URL_SLUG_TO_TYPE = { package: 'package', daily: 'daily', activities: 'activity' };
function classifyToursSegment(seg) {
  if (URL_SLUG_TO_TYPE[seg]) return { kind: 'type', value: URL_SLUG_TO_TYPE[seg] };
  if (seg.startsWith('from-') && seg.length > 5) return { kind: 'departure' };
  return null;
}
async function isKnownToursPath(segments) {
  if (segments.length === 0) return true; // /tours itself
  if (segments.length === 1) {
    const cls = classifyToursSegment(segments[0]);
    if (cls) return true; // a type/departure filter page is always "known", even if currently empty
    return !!(await db.tours.getPublishedBySlug(segments[0]));
  }
  if (segments.length === 2) {
    const c1 = classifyToursSegment(segments[0]);
    const c2 = classifyToursSegment(segments[1]);
    return !!c1 && !!c2 && c1.kind !== c2.kind;
  }
  return false;
}

async function isKnownPath(pathname) {
  // The whole /admin panel is a legitimate (client-auth-gated) part of the
  // app, not public content to validate against — always 200 so a direct
  // load or hard refresh of any admin screen doesn't get a false 404.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  if (STATIC_PAGE_PATHS.has(pathname)) return true;
  if (pathname === '/tours' || pathname.startsWith('/tours/')) {
    const rest = pathname.slice('/tours'.length).replace(/^\/|\/$/g, '');
    return isKnownToursPath(rest ? rest.split('/') : []);
  }
  const match = DETAIL_PREFIXES.find((d) => pathname.startsWith(d.prefix));
  if (!match) return false;
  const slug = pathname.slice(match.prefix.length);
  return !!(await match.collection().getPublishedBySlug(slug));
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Pre-launch guard: while Admin > Settings has "Site not ready — noindex" on
// (the default for a new/upgraded deployment), every single response — pages,
// API calls, uploaded files — carries this header, so search engines never
// index anything on the site before it's ready. Turn it off from Admin >
// Settings once the site is ready to go live.
app.use(async (req, res, next) => {
  try {
    const settings = await db.settings.get();
    if (settings.noindex_site) {
      res.set('X-Robots-Tag', 'noindex, nofollow');
    }
  } catch (err) {
    return next(err);
  }
  next();
});

// Site traffic / crawler log — records every page-level request (final
// status code included) tagged with bot detection, so admin can see
// Google/AI-bot activity and crawl errors (404s). Registered early so
// res.on('finish') captures whatever status code any later handler
// (redirects, the SPA catch-all, static file serving) ends up setting.
app.use((req, res, next) => {
  // Captured up front, synchronously — a nested router that fully handles
  // a request (e.g. the sitemap route) mutates req.url/req.path for the
  // rest of that request's lifetime once it responds without calling
  // next(), so reading req.path later inside the async 'finish' callback
  // below would silently log the wrong (rewritten) path.
  const requestPath = req.path;
  if (req.method === 'GET' && isLoggablePath(requestPath)) {
    const sessionId = getOrSetSessionId(req, res);
    res.on('finish', async () => {
      try {
        const botName = detectBot(req.headers['user-agent']);
        await db.visitLogs.create({
          source: 'server',
          path: requestPath,
          status_code: res.statusCode,
          is_bot: !!botName,
          bot_name: botName,
          user_agent: req.headers['user-agent'] || '',
          referrer: req.headers['referer'] || '',
          session_id: sessionId,
        });
      } catch {
        // Never let logging break a real response.
      }
    });
  }
  next();
});

// Uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin-configured redirects (e.g. after deleting or renaming a page) — must
// run before the API routes / SPA catch-all so an old URL sends visitors
// and search engines straight to the new one instead of a 404.
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  try {
    const redirect = await db.redirects.findByPath(req.path);
    if (redirect) {
      return res.redirect(redirect.status_code, redirect.to_path);
    }
  } catch (err) {
    return next(err);
  }
  next();
});

// API routes
app.use('/api/tours', toursRouter);
app.use('/api/admin/tours', adminToursRouter);
app.use('/api/transfer-routes', transferRoutesRouter);
app.use('/api/admin/transfer-routes', adminTransferRoutesRouter);
app.use('/api/blog', blogRouter);
app.use('/api/admin/blog', adminBlogRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/admin/destinations', adminDestinationsRouter);
app.use('/api/attractions', attractionsRouter);
app.use('/api/admin/attractions', adminAttractionsRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/admin/redirects', adminRedirectsRouter);
app.use('/api/admin/logs', adminLogsRouter);
app.use('/api/admin/site-files', adminSiteFilesRouter);
app.use('/api/track', trackRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/page-content', pageContentRouter);
app.use('/api/admin/page-content', adminPageContentRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// SEO: sitemap.xml regenerated on every request from whatever is currently
// published. llms.txt and robots.txt are served from admin-editable text
// (Admin > Site Files) instead of a static file.
app.use('/sitemap.xml', sitemapRouter);
app.use('/llms.txt', llmsTxtRouter);
app.use('/robots.txt', robotsTxtRouter);

// Serve the React build in production (server/public — on hosts like
// Hostinger where the "root directory" can only be server/, we put the
// build output inside server itself).
const clientDist = path.join(__dirname, 'public');
const indexHtmlPath = path.join(clientDist, 'index.html');
const indexHtmlTemplate = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf-8') : null;

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Google Search Console / Analytics (GA4) / Ads — IDs entered in Admin >
// Settings, injected into every page's <head> exactly as Google's own setup
// instructions specify: the verification meta tag and the gtag.js loader
// both need to land in <head>, as early as possible, before the page's own
// scripts run. If both GA4 and Ads IDs are set, Google's documented pattern
// is one shared gtag.js loader plus one gtag('config', ...) call per ID,
// rather than loading the library twice.
function buildGoogleHeadTags(s) {
  const tags = [];
  if (s.google_site_verification) {
    tags.push(`<meta name="google-site-verification" content="${escapeAttr(s.google_site_verification)}" />`);
  }
  const ga4Id = s.ga4_measurement_id;
  const adsId = s.google_ads_id;
  if (ga4Id || adsId) {
    const loaderId = escapeAttr(ga4Id || adsId);
    const configCalls = [ga4Id, adsId]
      .filter(Boolean)
      .map((id) => `    gtag('config', '${escapeAttr(id)}');`)
      .join('\n');
    tags.push(
      [
        '<!-- Google tag (gtag.js) -->',
        `<script async src="https://www.googletagmanager.com/gtag/js?id=${loaderId}"></script>`,
        '<script>',
        '    window.dataLayer = window.dataLayer || [];',
        '    function gtag(){dataLayer.push(arguments);}',
        "    gtag('js', new Date());",
        configCalls,
        '</script>',
      ].join('\n')
    );
  }
  return tags.join('\n');
}

// Pre-launch guard: while Admin > Settings has "Site not ready — noindex" on
// (the default for a new/upgraded deployment), every page tells search
// engines not to index it, so the site can't accidentally start showing up
// in search results before it's finished. Turn it off from Admin > Settings
// once the site is ready to go live.
function buildRobotsMetaTag(s) {
  return s.noindex_site ? '<meta name="robots" content="noindex, nofollow" />' : '';
}

if (indexHtmlTemplate) {
  // index: false — otherwise express.static silently serves public/index.html
  // for "/" itself (and any other directory-style request) before our
  // catch-all below ever runs, so the Google tags above would be missing
  // from the homepage's raw HTML.
  app.use(express.static(clientDist, { index: false }));
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    try {
      const [settings, known] = await Promise.all([db.settings.get(), isKnownPath(req.path)]);
      const headTags = [buildRobotsMetaTag(settings), buildGoogleHeadTags(settings)].filter(Boolean).join('\n');
      const html = headTags ? indexHtmlTemplate.replace('<head>', `<head>\n    ${headTags}`) : indexHtmlTemplate;
      res.status(known ? 200 : 404).type('html').send(html);
    } catch (err) {
      next(err);
    }
  });
}

// Generic error handler (e.g. multer file errors, DB errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error.' });
});

// The DB layer needs to create its schema / run the one-time data.json
// import / ensure the admin account exists before any request is served —
// all of that is now async (real DB calls), so the server only starts
// listening once it's done.
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server] failed to start — could not initialize the database:', err.message);
    process.exit(1);
  });
