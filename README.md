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
/transfer/                     → Transfer route search
/transfer/[slug]/              → Transfer route detail + booking widget
/destinations/                 → Destinations listing
/destinations/[slug]/          → Destination detail (Attractions, Gallery, FAQ)
/attraction/                   → Attractions listing (filterable by destination)
/attraction/[slug]/            → Attraction detail (fees, hours, map, nearby)
/blog/                         → Blog listing
/blog/[slug]/                  → Blog post
/about-us/
/contact/
/terms-and-conditions/
/privacy-policy/

/agency/login                 → Agency login (accounts are admin-created only)
/agency                        → Agency dashboard
/agency/tours                  → Every tour, at this agency's own rate
/agency/bookings                → This agency's booking requests + passenger/passport registry
/agency/ledger                  → Read-only "Ön Muhasebe" account statement
/agency/settings                → Change password

/admin/login                → Admin login
/admin                       → Admin overview
/admin/tours[/:id]           → Manage Tours (Package/Daily/Activity, one screen)
/admin/transfers[/:id]        → Manage Transfer Routes
/admin/destinations[/:id]     → Manage Destinations
/admin/attractions[/:id]      → Manage Attractions
/admin/agencies[/:id]         → Manage Agencies (profile, bookings, Ön Muhasebe)
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
  day-by-day itinerary, map route, and a 3-step booking widget that ties enquiries back to
  the specific listing (see "Tours Booking" below).
- **Admin panel** (`/admin/login`): log in and add/edit/delete Tours (tagged Package/Daily/
  Activity, with an optional Departure Point) and Blog Posts from one screen each. For
  tours: title, summary, full description, price, currency, duration, location, start
  date, capacity, image gallery and day-by-day itinerary can all be set.
- **Resilient front end:** unexpected render errors are caught by an `ErrorBoundary` so
  visitors never see a blank white screen.
- **Cost & Pricing** (per tour, in the admin edit screen): configure tiered vehicle costs
  by party size (e.g. a Vito for up to 5 people, a Sprinter for 6+), other flat fixed costs
  (e.g. the guide), and customer-selectable optional per-person costs (entrance fees, food,
  extras). See "Cost & Pricing" below for the full pricing formula and how role-based
  markup (Admin > Settings) applies.
- **Tours Booking — Private / Small Group** (`/tours/:slug`): every tour is Private (priced
  live via Cost & Pricing above) or Small Group (one flat guaranteed-departure price, no
  markup). A per-tour Availability calendar and a 3-step public booking widget (date +
  guests → customise with optional add-ons and a live price breakdown → contact + pick-up
  details) replace the old static price card. See "Tours Booking" below for the full
  breakdown.
- **Transfer** (`/transfer`): a separate product type for private point-to-point transfers
  (e.g. airport pickups). Admin manages Routes (pick-up/drop-off, duration, the same Cost &
  Pricing model as Tours) and a per-route Availability calendar (Available / On Request /
  Closed per date). Visitors search by pick-up/drop-off, land on a route page with a live
  booking widget (date, time, passenger count with automatic vehicle selection, One Way /
  Round Trip, optional extras) that computes the price live, and submit a reservation
  request — same as tours, this goes to Admin > Messages as an enquiry (see "Not yet
  included" below) rather than an online payment.
- **Destinations & Attractions** (`/destinations`, `/attraction`): a lightweight travel-guide
  content type, separate from bookable Tours/Transfer. Destinations (e.g. a cruise port or
  city) can list child Attractions (e.g. a castle or ruin); each Attraction detail page shows
  entrance fee, opening hours, best time to visit, a live Google Maps embed, and nearby
  attractions sorted by real distance. See "Destinations & Attractions" below.
- **Agency Portal (B2B)** (`/agency`): a separate login for travel agencies, entirely
  distinct from the public site and from Admin. Agencies are registered by the site owner
  only (Admin > Agencies — there's no public sign-up) and see every tour at their own net
  rate, can request a booking, register their travelers' passport details per booking, and
  read a running "Ön Muhasebe" account statement the admin maintains. See "Agency Portal"
  below for the full breakdown.
- **Home page** (`/`): Intro + "Tour Starting Points" (Destinations) + a hand-picked
  "Popular Tours" spotlight + the existing per-type sections + a hand-picked "Transfers"
  spotlight + "From the Blog". See "Home Page" below for how each section is populated.
- **Not yet included:** online payment / real booking inventory (currently both Tours and
  Transfer submit a booking request pre-filled with the full selection as a contact-message
  enquiry, landing in Admin > Messages) — the data model is structured so a booking +
  payment module (e.g. Stripe/iyzico/PayTR) can be added later without a rewrite.

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
- **Contact page**: a two-column design — an intro with info cards for Email, WhatsApp/
  Phone, Location and Response Time (each shown only if its field is filled in), WhatsApp
  and "Send Email" buttons, and a message form (First/Last Name, Email, Phone, optional
  Subject, Message) on the right. All four info-card values plus the new "Response Time"
  line are editable from `/admin/settings` → "Contact Page Info" — no code change needed
  to update them. The optional Subject field is folded into the top of the saved message
  (`Subject: ...`) rather than adding a new database column, so it also shows up cleanly
  under `/admin/messages`.
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

## Cost & Pricing

Each tour's — and each Transfer Route's — admin edit screen has a "Maliyet ve
Fiyatlandırma" (Cost & Pricing) section that drives how much a booking will cost. For
Transfer specifically, this is not just a preview: it's the actual price shown to
visitors, computed live from party size and vehicle selection (see "Transfer" below).

- **Vehicle tiers** — a fixed cost tiered by party size (e.g. 1-5 people → Vito, 6-12 →
  Sprinter). Exactly one tier applies per booking, picked automatically by how many people
  are booking.
- **Other fixed costs** — flat per-tour costs that don't depend on group size (e.g. the
  guide).
- **Optional costs** — per-person items the customer picks themselves at booking time
  (entrance fees, food, extras), grouped by category.

Role-based markup — set once, site-wide, in Admin > Settings — applies **only** to the
vehicle tier + other fixed costs, never to optional items:

```
Ödenecek Fiyat = (Sabit Maliyetler × (1 + Rol Bazlı Kâr Oranı)) + Seçilen İsteğe Bağlı Kalemler
```

The Cost & Pricing editor includes a live preview (party size, role, which optional items
are selected) so you can verify the total before saving — it uses the exact same formula
`server/lib/pricing.js` uses server-side (mirrored client-side in
`client/src/lib/pricing.js` purely so the preview updates instantly, with no server
round-trip).

## Tours Booking (Private / Small Group)

Every tour is one of two booking types, set on its admin edit screen ("Booking Type"
section, above Cost & Pricing):

- **Private** (default) — priced exactly like Transfer: the Cost & Pricing vehicle
  tiers + other fixed costs + role-based markup formula, picked automatically by party
  size.
- **Small Group** — a guaranteed-departure tour with one flat per-person price (the
  tour's own "Price" field) × guest count, with **no markup at all**. Guests simply join
  one of the existing scheduled departures instead of getting a dedicated
  vehicle/guide — so the Cost & Pricing screen hides the vehicle-tier and other-fixed-cost
  sections for these tours (only the optional per-person add-ons editor still applies).
  The formula lives in `calculateSmallGroupPrice()` in `server/lib/pricing.js`, mirrored
  in `client/src/lib/pricing.js` for the instant preview, the same "keep in sync" pattern
  as `calculateTourPrice()`.

Every tour also gets its own **Availability** calendar on the admin edit screen
(Available / On Request / Closed per date, defaulting to Available) — the exact same
generic `availability` table and `AvailabilityCalendar` component Transfer Routes use,
just attached to Tours as well now (`item_type = 'tour'`).

On the public tour page, the old static price card + contact form is replaced by a
3-step booking widget (`TourBookingWidget`):

1. **Select Date & Guests** — pick a date from the availability calendar (closed dates
   aren't selectable) and a guest count.
2. **Customise Your Tour** — see what's included (the vehicle + fixed-cost items for
   Private tours, or the tour's `included` list for Small Group), toggle optional
   per-person add-ons, and watch the price breakdown update live.
3. **Complete Your Booking** — a summary (tour, date, guests, total), then First/Last
   Name, Email, Phone, Pick-up Location (hotel/port/etc.) and Special Requests.

Like Transfer, there's no online payment yet, so "Send Booking Request" submits the
full selection as a composed enquiry through the same contact-message system (Admin >
Messages) — see "Booking flow" under What's Next below for what comes after this.

## Transfer

A second, separate product type at `/transfer` for private point-to-point transfers (e.g.
airport pickups), alongside Tours:

- **Admin > Transfers**: manage Routes — pick-up location, drop-off location, duration,
  distance, description, and the same Cost & Pricing model as Tours (vehicle tiers, other
  fixed costs, optional per-person extras).
- **Availability**: each route has its own calendar (Available / On Request / Closed per
  date, defaulting to Available so you only need to touch dates you want to restrict) —
  click a date in the admin editor to cycle its status.
- **Public `/transfer` page**: a plain (no colored hero band) title + intro + route search
  (pick-up + drop-off, with a swap button) that both filters the list below live and, when
  both ends are picked, jumps straight to that route's detail page via **Search**. A second,
  simpler **"Starts in"** dropdown sits right above the route list itself — same pick-up
  filter, kept in sync with the search card above it, for quickly narrowing a long list of
  routes without needing to also pick a drop-off.
- **Public `/transfer/:slug` page**: a booking widget — One Way / Round Trip, the
  availability calendar (closed dates aren't selectable), transfer time, passenger count
  (automatically recommends a vehicle tier as it changes, e.g. switching from a Vito to a
  Sprinter past 4 people — the visitor can still override this by clicking a different
  vehicle card), hotel/address, and any optional extras — with the price recalculating
  live using the exact same `pricing.js` formula as the Cost & Pricing editor.
- Submitting the widget sends a reservation request through the same contact-message
  system as Tours (Admin > Messages), with every selection (route, date, time, passengers,
  vehicle, price) included in the message — there's no online payment yet (see "Not yet
  included" above), so this is the interim way a request reaches you until the full
  booking flow is built.

## Destinations & Attractions

A simple travel-guide content type at `/destinations` and `/attraction`, separate from the
bookable Tours/Transfer products above — no pricing, no booking widget, just informational
pages that link back into the rest of the site.

- **Admin > Destinations**: manage Destinations — title, summary, a free-text description
  ("Paragraf 1"), Visitor Information, a photo gallery, and a repeatable FAQ list
  (question/answer pairs).
- **Admin > Attractions**: manage Attractions — title, an optional parent Destination (picked
  from a dropdown), summary/description, Entrance Fee / Opening Hours / Best Time (all free
  text, e.g. "€10" or "Free"), Visitor Information, a photo gallery, and Latitude/Longitude
  for the map.
- **Public `/destinations/:slug` page**: a top hero with the Title + Paragraph 1 on the left
  and the photo gallery on the right (a large first image plus up to 3 thumbnails — hidden
  entirely, text goes full-width, if no images are set), then Visitor Information, an
  "Attractions" section of clickable cards for every published Attraction under that
  Destination, a "Things To Do" section of tour cards (see below), and an FAQ accordion.
- **Things To Do**: a Tour can optionally be linked to a Destination too — pick one from the
  new **Destination (Things To Do)** dropdown on a tour's edit screen (Admin > Tours), same
  relation Attractions already have. Linked tours show up as cards in the "Things To Do"
  section on that Destination's page (hidden if none are linked), so a destination page can
  answer "what tours can I actually book here" alongside its Attractions.
- **Public `/attraction/:slug` page**: the same top hero layout as Destinations — H1, the
  Entrance Fee / Opening Hours / Best Time / Location info bar (Location links back to the
  parent Destination automatically), and the description on the left; the photo gallery on
  the right. Below that: Visitor Information, a live Google Maps embed (built from
  Latitude/Longitude — no Google API key needed), and a "Yakın Konumlar" (Nearby Locations)
  section showing other Attractions under the same Destination, sorted by actual distance
  when both have coordinates set.
- The Destination ↔ Attraction relationship is optional on both sides: an Attraction can be
  created without a Destination (it just won't show a Location or appear on any Destination
  page), and a Destination with no Attractions yet simply omits that section.
- **Schema.org / JSON-LD**: Destination pages emit `TouristDestination` (plus `FAQPage` when
  FAQ items are present); Attraction pages emit `TouristAttraction` (with `GeoCoordinates`
  when lat/lng are set) plus a `BreadcrumbList`. Entrance fees are shown as plain page text
  rather than forced into a structured price/offer, since the field is free text (e.g. "€4
  (yaklaşık)") and fabricating structured pricing from it would risk invalid data.

## Agency Portal (B2B)

A second, entirely separate login at `/agency` for travel agencies you work with — its own
JWT auth realm, its own token storage in the browser, its own layout and nav. An agency
token can never be used against an `/admin` route and an admin token can never be used
against an `/agency` route, even though both are signed with the same secret.

- **`/agency/login` is a pitch page, not just a form.** It now renders inside the same
  `PublicLayout` as every other public page (top navbar, footer, WhatsApp button — it was
  previously an orphaned route with none of those), with a "Agency Login" entry under the
  navbar's **Company** dropdown. Above the login form itself, it leads with an
  admin-editable headline + paragraph (Admin > Page Content > Agency Login, same
  H1/paragraph pattern used on Home/Contact/etc.) and a 4-icon row for the services offered
  (Tours, Hotels, Transfers, Shore Excursions), aimed at overseas agencies considering us as
  their Turkey/Ephesus-region operator. A "How It Works" column explains the (admin-only)
  onboarding process.
- **"Become a Partner" inline inquiry form**, below the How It Works / Login section —
  replaces the old link out to the general Contact page. Collects Company Name (required),
  Company Website, Contact Person Name (required), Phone (required) and Message (required);
  submits to the same `POST /api/contact` endpoint and `contact_messages` table the regular
  Contact form uses (two extra nullable columns, `company_name`/`company_website`, were
  added for it), so every submission shows up under **Admin > Messages** immediately,
  tagged with an amber "Partner Inquiry" badge and a clickable company website link. Because
  this form has no email field, `POST /api/contact` now accepts either an email or a phone
  number (previously email was always required) — the regular Contact form is unaffected
  since it still always collects both.

- **Registration is admin-only.** There is no public sign-up form — you register each
  agency yourself from **Admin > Agencies** (company/contact info, login email + password,
  an optional per-agency markup % override, and Active/Suspended status). Suspending an
  agency blocks its login instantly without losing its booking or ledger history; only
  deleting is blocked while it still has bookings (suspend instead).
- **Their own tour list, at their own rate** (`/agency/tours`): every published tour, in a
  plain list, priced with the same Cost & Pricing engine used everywhere else on the site
  but with `role: 'agency'` — using that agency's markup override when set, otherwise the
  site-wide **Admin > Settings > Agency Markup %**. Small Group tours show the same flat
  guaranteed-departure price as everyone else (no markup applies there for any role).
- **Booking requests** (`/agency/tours` → Request Booking): a condensed version of the
  public booking widget — pick a date against the tour's real availability calendar, set
  the party size, see a live agency-rate estimate, add a note — submits as a `pending`
  request. From **Admin > Agencies > [agency] > Bookings** you review it, adjust the final
  price if needed, and set it to Confirmed or Cancelled.
- **Passenger / passport registry** (`/agency/bookings` → Manage Passengers): once travelers
  are known, the agency (or the admin, for oversight) registers each one — full name,
  nationality, passport number, date of birth, passport expiry, notes — against the
  booking they're travelling on.
- **"Ön Muhasebe"** (`/agency/ledger`, admin-managed from the same Bookings/Ön Muhasebe
  tabs): a simple running current account per agency — 'Charge' entries (what they owe,
  usually one per confirmed booking, added automatically with a "Save & Add Charge to
  Ledger" button) and 'Payment' entries (what they've paid in, e.g. a bank transfer,
  entered manually). The balance is always `sum(charges) − sum(payments)`, computed live
  from the entries — never stored, so it can't drift out of sync. The agency can only read
  its own statement; entries themselves are managed from Admin > Agencies.
- Not included yet: file upload for a scanned passport copy (the registry above is
  text fields only — name, number, dates), and per-booking online payment (same "Not yet
  included" note as Tours/Transfer above applies here too).

## Home Page

The home page is built from several independent sections, each hidden automatically when
it has nothing to show:

- **Intro** — an admin-editable H1 + paragraph (Admin > Page Content > Home, same as
  before), on a plain background (no colored hero band). A paragraph longer than 150
  characters is cut with a "Read More" toggle so the section never grows too tall.
- **Tour Starting Points** — up to 6 cards reusing the Destinations content type (image +
  title, linking to its Destination page). Add/edit these from **Admin > Destinations**. The
  section's own headline and an optional paragraph underneath it are admin-editable at
  **Admin > Page Content > Home – "Tour Starting Points" section** (no SEO fields there —
  it's a section inside the Home page, not its own URL, so Home's own SEO Title/Description
  above already covers it).
- **Popular Tours** — up to 6 hand-picked tours. Check **"Featured on homepage"** on a
  tour's edit screen (Admin > Tours) to add it here; nothing shows until at least one tour
  is marked.
- **Package Tours / Daily Tours / Activities** — unchanged: the first 3 published tours of
  each type, same as before this update.
- **Transfers** — up to 6 hand-picked transfer routes (2 rows of 3), each showing
  pick-up → drop-off, duration, and a live "from" price. Check **"Featured on homepage"**
  on a route's edit screen (Admin > Transfers) to add it here.
- **From the Blog** — unchanged: the latest 3 posts.

## Demo Content

On first startup against a database with no tours yet, the server automatically publishes
3 sample Private tours (one Package, one Daily, one Activity — titles end with "(Örnek
İçerik)"), fully filled in including Cost & Pricing, plus 1 sample Small Group tour, 2
sample Transfer Routes, and 1 sample Destination with 2 sample Attractions (all also
"(Örnek İçerik)", including a few sample availability dates on the Transfer routes), so you
have something real to click through and review right after deploying, with zero setup.

A second, much larger batch — added later, requested so every section of the site could be
reviewed at full/realistic density instead of 1-2 items per section — seeds 5 more
Destinations (Kuşadası, Selçuk, Pamukkale, Bodrum, Bergama — 6 total) with 8 more
Attractions, 6 more Tours (2 Package/2 Daily/2 Activity, all marked **Featured on
homepage** and several linked to a Destination so "Things To Do" has something to show),
6 more Transfer Routes (all marked Featured), and — new, there was no Blog seed before this
— 6 Blog posts. Every one of these carries a placeholder photo from picsum.photos (same
approach as `server/scripts/seed.js` below — fetched by each visitor's own browser, so it
works regardless of the server's own network access) instead of the empty "No image" boxes
the first, smaller batch leaves.

This only ever happens once per content type: each batch is guarded by its own permanent
flag (`sample_content_seeded`, `sample_small_group_seeded`, `sample_transfer_seeded`,
`sample_destinations_seeded`, `sample_extra_content_seeded`), not by whether the sample
items still exist, so once you delete them from Admin > Tours / Transfers / Destinations &
Attractions / Blog (once you start entering your real content), they will not come back —
not even after a future update. This per-batch flagging is also why a future update can
safely add a new sample batch without re-seeding content you've already deleted: an update
that adds sample content always gets its own new flag, never reuses one from a previous
batch.

The Agency Portal is the one exception — no sample agency account is auto-created, since an
agency login carries real credentials and the site owner registers each one by hand from
Admin > Agencies anyway. Create one there to try the `/agency` flow end to end.

For a larger, more visual demo (18 tours across all three types plus 6 blog posts, with
placeholder photos), `server/scripts/seed.js` is available as an optional manual step —
run it from any machine with Node.js and network access to your deployed site:

```bash
SITE_URL=https://pamukkaleguidebook.com ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword \
  node server/scripts/seed.js
```

Titles end with "(demo)" so they're easy to find and delete later from the admin panel.

## What's Next

Roadmap towards a full booking platform (Cost & Pricing, Transfer, and Tours Booking
above are the first pieces):

- **Booking flow** — right now, "Send Booking Request" / "Send Reservation Request" on
  both Tours and Transfer submit a composed enquiry through the contact-message system
  (Admin > Messages) — there's no real seat/date inventory or online payment yet, so two
  customers could both request the same date and both need manual confirmation. A real
  booking flow would reserve the date the moment a request comes in (using the existing
  `availability` table), take payment, and send an automatic email ticket on
  confirmation.
- **Small Group departure capacity** — Small Group tours currently have unlimited
  guests per date; a real "guaranteed departure, guests join one of 2 existing groups"
  model needs a capacity/headcount concept per date, not just Available/On
  Request/Closed.
- **Agency Panel** — a separate login for travel agencies, seeing agency-role pricing
  (lower markup) instead of the public customer price.

An eventual payment/booking flow (you'll pick a provider — Stripe, iyzico and PayTR are
common choices) can be layered on top once the above is in place. The move to MySQL (see
above) was the groundwork for all of this: booking and per-date availability need real
transactional guarantees a JSON file can't provide, so that the last seat on a tour can
never be double-booked by two people at once.

Tour categories, coupon codes and further content types can be layered on top of this
structure fairly easily.
