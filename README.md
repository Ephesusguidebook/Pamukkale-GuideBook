# Pamukkale GuideBook — Tour Website

A tour website with a public front end (Tours — Package Tours, Daily Tours and Activities
in one filterable section — plus a Blog and info pages) and an admin panel to manage all
of that content.

## Folder Structure

```
tour-site/
  server/   → Node.js + Express API
  client/   → React (Vite) front end — public site + admin panel
```

Data is stored in a MySQL database (create one from Hostinger's hPanel under Databases >
MySQL Databases, or run your own MySQL/MariaDB server locally).

## URL Structure

```
/                              → Home
/tours/                        → Tours listing (Package + Daily + Activities, mixed)
/tours/package/                → Type filter — Package Tours only
/tours/daily/                  → Type filter — Daily Tours only
/tours/activities/             → Type filter — Activities only
/tours/from-[departure]/       → Departure filter (e.g. /tours/from-kusadasi/)
/tours/[type]/from-[departure]/→ Type + departure filters combined, either order
/tours/[slug]/                 → Tour detail page
/blog/                         → Blog listing
/blog/[slug]/                  → Blog post
/about-us/
/contact/
/terms-and-conditions/
/privacy-policy/

/admin/login                → Admin login
/admin                       → Admin overview
/admin/tours[/:id]           → Manage Tours (Package/Daily/Activity, one screen)
/admin/blog[/:id]            → Manage Blog Posts
/admin/messages              → Contact form submissions
/admin/media                 → Media Library (folders + photo uploads)
/admin/redirects             → Redirects (old URL → new URL)
/admin/traffic                → Traffic & crawler log, crawl errors, pages/session
/admin/logs                   → Admin activity log
/admin/site-files             → Edit llms.txt and robots.txt
/admin/settings              → Travel consultant card + branding
```

Package Tours, Daily Tours and Activities are managed from a single **Tours** admin
screen and stored in one data collection, tagged with a **Type** (Package/Daily/Activity)
and an optional **Departure Point** (free text, e.g. "Kusadasi"). Publicly they all live
under `/tours` — the base listing mixes every type together, and the Type and Departure
Point filters (each with their own URL, and combinable) narrow it down. A tour's Type and
Departure Point are set on its edit form under Admin > Tours.

## Features

- **Front end:** Home page, a unified Tours section (Package Tours, Daily Tours and
  Activities, filterable by type and by departure point), a Blog, and static About Us /
  Terms and Conditions / Privacy Policy pages. Every tour detail page has a gallery,
  day-by-day itinerary, map route, and a contact form that ties enquiries back to the
  specific listing.
- **Admin panel** (`/admin/login`): log in and add/edit/delete Tours (tagged Package/Daily/
  Activity, with an optional Departure Point) and Blog Posts from one screen each. For
  tours: title, summary, full description, price, currency, duration, location, start
  date, capacity, image gallery and day-by-day itinerary can all be set.
- **Resilient front end:** unexpected render errors are caught by an `ErrorBoundary` so
  visitors never see a blank white screen.
- **Not yet included:** online payment / booking (currently just a contact form) — the
  data model is structured so a booking + payment module (e.g. Stripe/iyzico/PayTR) can be
  added later without a rewrite.

## Local Development

Requires Node.js 18+ (tested with Node 22) and a MySQL or MariaDB server (tested with
MariaDB 10.11) reachable from where you run the backend.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Open .env and set DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME to point at your
# MySQL database, set JWT_SECRET to a long random string, and set ADMIN_EMAIL /
# ADMIN_PASSWORD to your own admin login.
npm start
```

The server runs on `http://localhost:4000`. On first run it automatically creates the
database tables it needs and an admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`.env` (if the `admin_users` table is empty). To reset the admin account later, delete the
row from the `admin_users` table and restart.

### 2. Frontend (dev mode)

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Opens on `http://localhost:5173` and automatically proxies `/api` requests to the backend
(port 4000).

## Production Build

```bash
cd client
npm install
npm run build        # produces client/dist

cd ../server
npm install
npm start             # a single Node.js process serves both the API and client/dist
```

After this, a single Node.js process (`server/index.js`) serves both the API and the
built React site from the same address (e.g. `http://localhost:4000`) — this is exactly
what Hostinger's "Node.js Web Application" option expects.

## Deploying to Hostinger

If you're using the "Node.js Web Application" option:

1. Push this project to a GitHub repository (or upload files directly — Hostinger offers
   "deploy from GitHub, upload files, or deploy directly from your IDE").
2. In Hostinger, set the **Startup file / entry point** to `server/index.js`.
3. Set the **build command** (if the panel has a build command field) to:
   ```
   cd client && npm install && npm run build && cd ../server && npm install
   ```
   If there's no single build command field, you can build `client/dist` locally and
   include it in the repo instead.
4. In hPanel, go to **Databases > MySQL Databases** and create a database (and a user for
   it, if one isn't created automatically). Note the database name, username, password and
   host it gives you — usually `localhost` on Hostinger.
5. Add these **Environment Variables**:
   - `DB_HOST`, `DB_PORT` (3306), `DB_USER`, `DB_PASSWORD`, `DB_NAME` → from the database
     you just created
   - `JWT_SECRET` → a long, random string
   - `ADMIN_EMAIL` → email for admin login
   - `ADMIN_PASSWORD` → password for admin login
   - `PORT` → Hostinger usually sets this automatically.
6. After deploying, go to your site, log in via `/admin/login` with the credentials from
   `.env`, and add your first tour.

> **Upgrading an existing deployment from the JSON-file version:** older versions of this
> project stored everything in a single `server/data.json` file instead of a database. If
> that file is still present next to `server/index.js` on your first deploy of this
> version, the server automatically creates all the MySQL tables it needs and imports
> everything from `data.json` into them — tours (with type, departure point, images,
> itinerary), blog posts, contact messages, media library entries, redirects, admin users,
> settings, page content and site files all carry over with their original IDs, so nothing
> that referenced them (contact message → tour links, old admin logs, etc.) breaks. This
> runs once, automatically, the first time the server starts up against an empty database —
> no manual export/import step. `data.json` itself is left untouched on disk afterwards (it
> is no longer read or written to); you can keep it as a backup or delete it once you've
> confirmed everything looks right in the admin panel.
>
> **Upgrading from the even older separate Package Tours / Daily Tours / Activities
> version:** if `data.json` still has that older shape (from before the `/tours` URL
> restructure), the same one-time import folds it into the unified Tours shape first,
> tagging each item with its Type and reassigning any slug that collides with a reserved
> `/tours` URL word (`tours`, `package`, `daily`, `activities`, `activity`, or anything
> starting with `from-`) with a `tour-` prefix, exactly as before — it now just lands in
> MySQL instead of a rewritten `data.json`.

## Extra Features

- **Page Content editor** (`/admin/page-content`): edit the H1 headline and intro paragraph
  of every page without touching code.
- **WhatsApp button**: set a phone number in `/admin/settings` under "WhatsApp Button" to
  show a floating WhatsApp button on every page. Leave it empty to hide the button.
- **Lead notification emails**: set a "Notification Email" in `/admin/settings` to get an
  email whenever the contact form is submitted (in addition to it always appearing under
  `/admin/messages`). Requires the `SMTP_*` variables in `.env` to be filled in — most
  hosting providers (including Hostinger) give you an SMTP mailbox you can use here. If
  `SMTP_HOST` is left blank, email notifications are simply skipped.
- **SEO**: `/sitemap.xml` is generated on every request from whatever is currently
  published — every tour, every distinct departure point (as a `/tours/from-...` entry),
  every type filter, and blog posts and static pages. Tour pages and Blog posts include
  schema.org structured data (`TouristTrip` / `BlogPosting`) for richer search results.
  Filtered `/tours` pages (by type, by departure, or both) get their own auto-generated,
  unique heading and meta description so they read as distinct pages rather than
  duplicate content. Every tour/blog post form and every static page in Page Content also
  has its own **SEO Title** and **SEO Description** fields — set the browser tab title and
  search-result snippet directly; leave them blank to fall back to the title/summary
  already entered.
- **Site Files** (`/admin/site-files`): edit the raw text served at `/llms.txt` (describes
  the site to AI assistants/crawlers such as ChatGPT, Claude, Perplexity) and `/robots.txt`
  (tells search engines what they may crawl) directly from the admin panel — no code change
  or redeploy needed. Both are served dynamically from this saved text.
- **404 page**: a genuinely unknown or deleted URL now shows a proper "Page Not Found"
  screen (with a real 404 HTTP status, so it also shows up correctly in Traffic &
  Crawlers → crawl errors) with a contact form (Name, Email, Phone, Message) so a lost
  visitor can reach out directly, plus quick links to each Tours type (Package, Daily,
  Activities).
- **Google Search Console / Analytics (GA4) / Ads** (`/admin/settings` → "Search Console,
  Analytics & Ads"): paste the verification code Search Console gives you, your GA4
  Measurement ID (`G-...`), and/or your Google Ads Conversion ID (`AW-...`) — you can paste
  either the bare code or the whole snippet Google shows you, the right value is pulled out
  automatically. Saving injects the verification `<meta>` tag and the `gtag.js` install
  snippet into the `<head>` of every page, exactly per Google's own setup instructions (one
  shared loader plus one `gtag('config', ...)` call per ID if both GA4 and Ads are set).
  Leave a field empty to leave that tag out entirely.
- **Redirects** (`/admin/redirects`): after deleting a tour/blog post, or renaming one
  (which changes its URL), add a redirect from the old path to the new one (301 Permanent
  or 302 Temporary). The server checks every incoming page request against this list
  before anything else, so old links and search results land visitors on the right page
  instead of a "not found" error. Also useful for pointing old `/package-tours/...`,
  `/daily-tours/...` and `/activities/...` links at their new `/tours/...` equivalents
  after upgrading (see "Upgrading an existing deployment" above) — these redirects are not
  created automatically and are added here manually.
- **Branding**: `/admin/settings` has a Branding section for a Site Logo and Favicon, both
  chosen from the Media Library. The logo replaces the default "TurRota" mark in the navbar,
  and the favicon is applied site-wide automatically.
- **Activity log** (`/admin/logs`): every admin login and every create/update/delete
  (tours, activities, blog posts, media, redirects, settings, page content) is recorded with
  who did it and when.
- **Traffic & crawlers** (`/admin/traffic`): every page-level request the server handles is
  logged with its final HTTP status and User-Agent-based bot detection — Googlebot, GPTBot,
  ClaudeBot, PerplexityBot and 20+ other search/AI/monitoring crawlers are recognized by
  name. The dashboard shows bot vs. visitor traffic, crawl errors (404s — a genuinely
  unknown or deleted URL now correctly returns 404 instead of always answering 200), and how
  many pages real visitors browse per session (tracked via a lightweight session cookie and
  a ping the site sends on every in-app page change — this stays focused on real visitors
  since crawlers rarely run that JS).
- **FAQ page** (`/faq/`) is included and listed under the "Company" menu alongside About
  Us, Terms and Conditions, and Privacy Policy.
- **Media Library** (`/admin/media`): upload photos here first — organize them into
  folders if you like — and every photo is automatically converted to WebP for faster page
  loads (falls back to the original file if a particular image can't be converted). Tour
  galleries (Package/Daily/Activity alike), Blog cover images, and the consultant photo in
  Settings all pick their images from this library instead of uploading a file per form, so
  the same photo can be reused across multiple listings. Files are stored under
  `server/uploads/media/`.

## Demo Content

`server/scripts/seed.js` publishes 6 Package Tours, 6 Daily Tours and 6 Activities (18
tours total, all under `/tours`, tagged with their Type) plus 6 Blog posts with realistic
placeholder text and photos, so you can see the full site design populated. Run it against
your own deployment:

```bash
SITE_URL=https://pamukkaleguidebook.com ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword \
  node server/scripts/seed.js
```

Titles end with "(demo)" so they're easy to find and delete later from the admin panel.

## What's Next

- Add a payment/booking flow when you're ready (you'll need to pick a payment provider —
  Stripe, iyzico and PayTR are common choices). The move to MySQL (see above) was the
  groundwork for this: booking and per-date availability need real transactional
  guarantees a JSON file can't provide, so that the last seat on a tour can never be
  double-booked by two people at once.
- Tour categories, coupon codes and further content types can be layered on top of this
  structure fairly easily.
