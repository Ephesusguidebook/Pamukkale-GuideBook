# Pamukkale GuideBook — Tour Website

A tour website with a public front end (Package Tours, Daily Tours, Activities, Blog and
info pages) and an admin panel to manage all of that content.

## Folder Structure

```
tour-site/
  server/   → Node.js + Express API
  client/   → React (Vite) front end — public site + admin panel
```

Data is stored as a single JSON file (`server/data.json`), no separate database server
required.

## URL Structure

```
/                          → Home
/package-tours/            → Package Tours listing
/package-tours/[slug]/     → Package Tour detail
/daily-tours/               → Daily Tours listing
/daily-tours/[slug]/        → Daily Tour detail
/activities/                → Activities listing
/activities/[slug]/         → Activity detail
/blog/                       → Blog listing
/blog/[slug]/                → Blog post
/about-us/
/contact/
/terms-and-conditions/
/privacy-policy/

/admin/login                → Admin login
/admin                       → Admin overview
/admin/package-tours[/:id]   → Manage Package Tours
/admin/daily-tours[/:id]     → Manage Daily Tours
/admin/activities[/:id]      → Manage Activities
/admin/blog[/:id]            → Manage Blog Posts
/admin/messages              → Contact form submissions
/admin/media                 → Media Library (folders + photo uploads)
/admin/redirects             → Redirects (old URL → new URL)
/admin/traffic                → Traffic & crawler log, crawl errors, pages/session
/admin/logs                   → Admin activity log
/admin/settings              → Travel consultant card + branding
```

Package Tours, Daily Tours and Activities are each stored and managed independently
(separate data collections, separate API endpoints, separate admin screens), even though
they share the same UI components under the hood.

## Features

- **Front end:** Home page, three independent tour categories (Package Tours, Daily
  Tours, Activities), a Blog, and static About Us / Terms and Conditions / Privacy Policy
  pages. Every tour-like detail page has a gallery, day-by-day itinerary, map route, and a
  contact form that ties enquiries back to the specific listing.
- **Admin panel** (`/admin/login`): log in and add/edit/delete Package Tours, Daily Tours,
  Activities and Blog Posts independently, each with its own list and form. For tour-like
  items: title, summary, full description, price, currency, duration, location, start
  date, capacity, image gallery and day-by-day itinerary can all be set.
- **Resilient front end:** unexpected render errors are caught by an `ErrorBoundary` so
  visitors never see a blank white screen.
- **Not yet included:** online payment / booking (currently just a contact form) — the
  data model is structured so a booking + payment module (e.g. Stripe/iyzico/PayTR) can be
  added later without a rewrite.

## Local Development

Requires Node.js 18+ (tested with Node 22).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Open .env and set JWT_SECRET to a long random string, and set
# ADMIN_EMAIL / ADMIN_PASSWORD to your own admin login.
npm start
```

The server runs on `http://localhost:4000`. On first run it automatically creates an
admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (if the database is empty).
To reset the admin account later, delete `server/data.json` and restart, or edit the file
directly.

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
4. Add these **Environment Variables**:
   - `JWT_SECRET` → a long, random string
   - `ADMIN_EMAIL` → email for admin login
   - `ADMIN_PASSWORD` → password for admin login
   - `PORT` → Hostinger usually sets this automatically.
5. After deploying, go to your site, log in via `/admin/login` with the credentials from
   `.env`, and add your first Package Tour, Daily Tour or Activity.

> Note: `data.json` is stored on disk on the server. If Hostinger's Node.js hosting has
> persistent disk (most shared/VPS plans do), this is fine. If traffic grows or you need
> to run multiple server instances, you'll eventually want to move to a proper database
> (e.g. MySQL/PostgreSQL) — the architecture makes that migration straightforward.
>
> **Upgrading an existing deployment:** if this server was already running the previous
> single-collection version, the first restart after this update automatically migrates
> whatever was in the old "tours" list into Package Tours. Re-categorize any of those into
> Daily Tours or Activities from the admin panel if needed.

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
  published (tours, activities, blog posts, static pages). `/llms.txt` describes the site
  for AI crawlers. Package Tour / Daily Tour / Activity pages and Blog posts include
  schema.org structured data (`TouristTrip` / `BlogPosting`) for richer search results.
  Every tour/activity/blog post form and every static page in Page Content also has its own
  **SEO Title** and **SEO Description** fields — set the browser tab title and search-result
  snippet directly; leave them blank to fall back to the title/summary already entered.
- **Redirects** (`/admin/redirects`): after deleting a tour/activity/blog post, or renaming
  one (which changes its URL), add a redirect from the old path to the new one (301
  Permanent or 302 Temporary). The server checks every incoming page request against this
  list before anything else, so old links and search results land visitors on the right
  page instead of a "not found" error.
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
  loads (falls back to the original file if a particular image can't be converted). Package
  Tour / Daily Tour / Activity galleries, Blog cover images, and the consultant photo in
  Settings all pick their images from this library instead of uploading a file per form, so
  the same photo can be reused across multiple listings. Files are stored under
  `server/uploads/media/`.

## Demo Content

`server/scripts/seed.js` publishes 6 Package Tours, 6 Daily Tours, 6 Activities and 6 Blog
posts with realistic placeholder text and photos, so you can see the full site design
populated. Run it against your own deployment:

```bash
SITE_URL=https://pamukkaleguidebook.com ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword \
  node server/scripts/seed.js
```

Titles end with "(demo)" so they're easy to find and delete later from the admin panel.

## What's Next

- Add a payment/booking flow when you're ready (you'll need to pick a payment provider —
  Stripe, iyzico and PayTR are common choices).
- Tour categories, coupon codes and further content types can be layered on top of this
  structure fairly easily.
