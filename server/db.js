const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const mysql = require('mysql2/promise');

// MySQL-backed data layer. Every collection below is async — every call
// site must `await` it. This replaced the original single-JSON-file layer
// (server/db.js used to just read/write server/data.json) because booking
// and availability need real transactional guarantees: two people booking
// the last seat on the same tour at the same moment must not both succeed,
// and a JSON file rewritten wholesale on every write can't provide that.
// MySQL was chosen over e.g. SQLite specifically because Hostinger's
// hPanel provides MySQL databases out of the box on shared/managed
// hosting (no native module compilation, no separate DB server to run).

const DATA_FILE = path.join(__dirname, 'data.json');

function nowIso() {
  return new Date().toISOString();
}

// --- Connection pool ---
// DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME match exactly what Hostinger's
// own "Connecting a Hostinger MySQL database to a Node.js application" guide
// gives you when you create a database from hPanel > Databases > MySQL
// Databases — copy those values straight into .env.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// JSON columns: mysql2 auto-parses them back into JS values on SELECT, but
// on INSERT/UPDATE a JS array/object must be stringified first — otherwise
// mysql2 treats an array parameter as "expand into a SQL list" (the `IN (?)`
// convention) instead of a value to bind.
function j(value) {
  return JSON.stringify(value === undefined ? null : value);
}

// --- Schema ---
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at VARCHAR(40) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'package',
    departure_point VARCHAR(255) NOT NULL DEFAULT '',
    title VARCHAR(500) NOT NULL DEFAULT '',
    summary TEXT,
    description LONGTEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    price_note VARCHAR(255) NOT NULL DEFAULT '',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    duration_days INT NOT NULL DEFAULT 1,
    location VARCHAR(255) NOT NULL DEFAULT '',
    start_date VARCHAR(50) NOT NULL DEFAULT '',
    capacity INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    cover_image VARCHAR(500) NOT NULL DEFAULT '',
    languages JSON,
    highlights JSON,
    included JSON,
    excluded JSON,
    images JSON,
    itinerary JSON,
    route JSON,
    vehicle_tiers JSON,
    fixed_costs JSON,
    optional_costs JSON,
    seo_title VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT '',
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_tours_status (status),
    INDEX idx_tours_type (type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS transfer_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL DEFAULT '',
    pickup_location VARCHAR(255) NOT NULL DEFAULT '',
    dropoff_location VARCHAR(255) NOT NULL DEFAULT '',
    duration_text VARCHAR(100) NOT NULL DEFAULT '',
    distance_km INT NOT NULL DEFAULT 0,
    summary TEXT,
    description LONGTEXT,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    vehicle_tiers JSON,
    fixed_costs JSON,
    optional_costs JSON,
    seo_title VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT '',
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_transfer_status (status),
    INDEX idx_transfer_pickup (pickup_location),
    INDEX idx_transfer_dropoff (dropoff_location)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Generic per-date status, keyed by (item_type, item_id) so it can cover
  // Transfer Routes now and Tours (Faz 3) later without another table.
  `CREATE TABLE IF NOT EXISTS availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(30) NOT NULL,
    item_id INT NOT NULL,
    date VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    UNIQUE KEY uniq_availability_item_date (item_type, item_id, date),
    INDEX idx_availability_item (item_type, item_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL DEFAULT '',
    excerpt TEXT,
    content LONGTEXT,
    cover_image VARCHAR(500) NOT NULL DEFAULT '',
    author VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    seo_title VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT '',
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_blog_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(30) NULL,
    item_id INT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at VARCHAR(40) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS media_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '',
    parent_id INT NULL,
    created_at VARCHAR(40) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS media_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL DEFAULT '',
    filename VARCHAR(255) NOT NULL DEFAULT '',
    original_name VARCHAR(255) NOT NULL DEFAULT '',
    folder_id INT NULL,
    size INT NOT NULL DEFAULT 0,
    width INT NULL,
    height INT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_media_folder (folder_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS redirects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_path VARCHAR(500) NOT NULL,
    to_path VARCHAR(500) NOT NULL DEFAULT '',
    status_code INT NOT NULL DEFAULT 301,
    created_at VARCHAR(40) NOT NULL,
    UNIQUE KEY uniq_from_path (from_path(255))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL DEFAULT '',
    action VARCHAR(30) NOT NULL DEFAULT '',
    entity_type VARCHAR(50) NOT NULL DEFAULT '',
    entity_label VARCHAR(500) NOT NULL DEFAULT '',
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_adminlogs_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS visit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(10) NOT NULL DEFAULT 'server',
    path VARCHAR(500) NOT NULL DEFAULT '',
    status_code INT NULL,
    is_bot TINYINT(1) NOT NULL DEFAULT 0,
    bot_name VARCHAR(100) NULL,
    user_agent VARCHAR(500) NOT NULL DEFAULT '',
    referrer VARCHAR(500) NOT NULL DEFAULT '',
    session_id VARCHAR(100) NOT NULL DEFAULT '',
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_visitlogs_created (created_at),
    INDEX idx_visitlogs_session (session_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS site_files (
    file_key VARCHAR(50) PRIMARY KEY,
    content LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY,
    consultant_name VARCHAR(255) NOT NULL DEFAULT '',
    consultant_title VARCHAR(255) NOT NULL DEFAULT '',
    consultant_phone VARCHAR(50) NOT NULL DEFAULT '',
    consultant_whatsapp VARCHAR(50) NOT NULL DEFAULT '',
    consultant_email VARCHAR(255) NOT NULL DEFAULT '',
    consultant_photo VARCHAR(500) NOT NULL DEFAULT '',
    whatsapp_button_phone VARCHAR(50) NOT NULL DEFAULT '',
    notification_email VARCHAR(255) NOT NULL DEFAULT '',
    contact_email VARCHAR(255) NOT NULL DEFAULT '',
    contact_phone VARCHAR(50) NOT NULL DEFAULT '',
    contact_address VARCHAR(500) NOT NULL DEFAULT '',
    facebook_url VARCHAR(500) NOT NULL DEFAULT '',
    instagram_url VARCHAR(500) NOT NULL DEFAULT '',
    site_logo VARCHAR(500) NOT NULL DEFAULT '',
    site_favicon VARCHAR(500) NOT NULL DEFAULT '',
    google_site_verification VARCHAR(255) NOT NULL DEFAULT '',
    ga4_measurement_id VARCHAR(50) NOT NULL DEFAULT '',
    google_ads_id VARCHAR(50) NOT NULL DEFAULT '',
    noindex_site TINYINT(1) NOT NULL DEFAULT 1,
    agency_markup_percent DECIMAL(6,2) NOT NULL DEFAULT 10,
    customer_markup_percent DECIMAL(6,2) NOT NULL DEFAULT 20,
    sample_content_seeded TINYINT(1) NOT NULL DEFAULT 0,
    sample_transfer_seeded TINYINT(1) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS page_content (
    page_key VARCHAR(50) PRIMARY KEY,
    h1 VARCHAR(500) NOT NULL DEFAULT '',
    p TEXT,
    seo_title VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function createSchema() {
  for (const stmt of SCHEMA_STATEMENTS) {
    await query(stmt);
  }
}

// --- Additive column migrations ---
// A brand-new install gets every column straight from SCHEMA_STATEMENTS
// above (CREATE TABLE IF NOT EXISTS never touches a table that already
// exists), so whenever a later update needs a new column on an existing
// live table, it has to be added here instead — checked against
// information_schema first so this is safe to run on every startup
// (no-op once the column is already there) on both MySQL and MariaDB.
async function ensureColumn(table, column, definition) {
  const rows = await query(
    'SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  if (Number(rows[0].c) > 0) return;
  await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function runColumnMigrations() {
  // Faz 2 — cost & pricing screen (added after the initial MySQL launch).
  await ensureColumn('tours', 'vehicle_tiers', 'JSON NULL');
  await ensureColumn('tours', 'fixed_costs', 'JSON NULL');
  await ensureColumn('tours', 'optional_costs', 'JSON NULL');
  await ensureColumn('settings', 'agency_markup_percent', "DECIMAL(6,2) NOT NULL DEFAULT 10");
  await ensureColumn('settings', 'customer_markup_percent', "DECIMAL(6,2) NOT NULL DEFAULT 20");
  await ensureColumn('settings', 'sample_content_seeded', 'TINYINT(1) NOT NULL DEFAULT 0');

  // Faz 6 — Transfer.
  await ensureColumn('settings', 'sample_transfer_seeded', 'TINYINT(1) NOT NULL DEFAULT 0');
}

// --- One-time migration: server/data.json -> MySQL ---
// Runs automatically at startup, exactly once (guarded by "tours table is
// still empty"), so upgrading a live deployment to this version needs no
// manual steps beyond setting the DB_* environment variables — same
// zero-touch deploy story as every migration before this one.
async function migrateFromJsonIfNeeded() {
  const [{ c }] = await query('SELECT COUNT(*) AS c FROM tours');
  if (Number(c) > 0) return; // already migrated (or a fresh install with no data.json)
  if (!fs.existsSync(DATA_FILE)) return; // nothing to migrate

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return;
  }

  const TOUR_TYPES_LOCAL = ['package', 'daily', 'activity'];
  const RESERVED = new Set(['tours', 'package', 'daily', 'activities', 'activity']);
  const isReserved = (s) => RESERVED.has(s) || s.startsWith('from-');

  // The site should already be on the unified `tours` collection (from the
  // /tours URL-restructure update) by the time this runs. Defensively also
  // folds in the older per-type shape in case that step was ever skipped.
  const alreadyUnified = Array.isArray(parsed.tours) && parsed.tours.length > 0;
  const sources = alreadyUnified
    ? [{ items: parsed.tours, type: null }] // type already set per item
    : [
        { items: Array.isArray(parsed.packageTours) ? parsed.packageTours : [], type: 'package' },
        { items: Array.isArray(parsed.dailyTours) ? parsed.dailyTours : [], type: 'daily' },
        { items: Array.isArray(parsed.activities) ? parsed.activities : [], type: 'activity' },
      ];

  const usedSlugs = new Set();
  const idMap = {}; // `${type}:${oldId}` -> finalId (only populated when ids are reassigned)
  let tourCount = 0;

  for (const { items, type: forcedType } of sources) {
    for (const item of items) {
      const type = forcedType || (TOUR_TYPES_LOCAL.includes(item.type) ? item.type : 'package');
      const rawBase = item.slug || 'tour';
      const base = isReserved(rawBase) ? `tour-${rawBase}` : rawBase;
      let slug = base;
      let i = 2;
      while (isReserved(slug) || usedSlugs.has(slug)) slug = `${base}-${i++}`;
      usedSlugs.add(slug);

      const created = item.created_at || nowIso();
      const updated = item.updated_at || created;
      const [result] = await pool.query(
        `INSERT INTO tours (id, slug, type, departure_point, title, summary, description, price,
           original_price, price_note, currency, duration_days, location, start_date, capacity,
           status, cover_image, languages, highlights, included, excluded, images, itinerary, route,
           seo_title, seo_description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alreadyUnified ? item.id : null,
          slug,
          type,
          item.departure_point || '',
          item.title || '',
          item.summary || '',
          item.description || '',
          Number(item.price) || 0,
          Number(item.original_price) || 0,
          item.price_note || '',
          item.currency || 'USD',
          Number(item.duration_days) || 1,
          item.location || '',
          item.start_date || '',
          Number(item.capacity) || 0,
          item.status === 'draft' ? 'draft' : 'published',
          item.cover_image || '',
          j(item.languages || []),
          j(item.highlights || []),
          j(item.included || []),
          j(item.excluded || []),
          j(item.images || []),
          j(item.itinerary || []),
          j(item.route || []),
          item.seo_title || '',
          item.seo_description || '',
          created,
          updated,
        ]
      );
      if (!alreadyUnified) idMap[`${type}:${item.id}`] = result.insertId;
      tourCount += 1;
    }
  }

  for (const post of parsed.blogPosts || []) {
    const created = post.created_at || nowIso();
    await pool.query(
      `INSERT INTO blog_posts (id, slug, title, excerpt, content, cover_image, author, status,
         seo_title, seo_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.id,
        post.slug,
        post.title || '',
        post.excerpt || '',
        post.content || '',
        post.cover_image || '',
        post.author || '',
        post.status === 'draft' ? 'draft' : 'published',
        post.seo_title || '',
        post.seo_description || '',
        created,
        post.updated_at || created,
      ]
    );
  }

  const TYPE_TO_ITEM_TYPE = { package: 'package_tour', daily: 'daily_tour', activity: 'activity' };
  for (const msg of parsed.contactMessages || []) {
    let itemId = msg.item_id || null;
    if (!alreadyUnified && itemId && msg.item_type) {
      const type = Object.keys(TYPE_TO_ITEM_TYPE).find((t) => TYPE_TO_ITEM_TYPE[t] === msg.item_type);
      if (type) itemId = idMap[`${type}:${itemId}`] || null;
    }
    await pool.query(
      `INSERT INTO contact_messages (id, item_type, item_id, name, email, phone, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msg.id,
        msg.item_type || null,
        itemId,
        msg.name || '',
        msg.email || '',
        msg.phone || '',
        msg.message || '',
        msg.status || 'new',
        msg.created_at || nowIso(),
      ]
    );
  }

  for (const folder of parsed.mediaFolders || []) {
    await pool.query(
      `INSERT INTO media_folders (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)`,
      [folder.id, folder.name || '', folder.parent_id || null, folder.created_at || nowIso()]
    );
  }
  for (const item of parsed.mediaItems || []) {
    await pool.query(
      `INSERT INTO media_items (id, url, filename, original_name, folder_id, size, width, height, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.url || '',
        item.filename || '',
        item.original_name || '',
        item.folder_id || null,
        item.size || 0,
        item.width || null,
        item.height || null,
        item.created_at || nowIso(),
      ]
    );
  }
  for (const r of parsed.redirects || []) {
    await pool.query(
      `INSERT INTO redirects (id, from_path, to_path, status_code, created_at) VALUES (?, ?, ?, ?, ?)`,
      [r.id, r.from_path, r.to_path, r.status_code || 301, r.created_at || nowIso()]
    );
  }
  for (const log of parsed.adminLogs || []) {
    await pool.query(
      `INSERT INTO admin_logs (id, admin_email, action, entity_type, entity_label, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [log.id, log.admin_email || '', log.action || '', log.entity_type || '', log.entity_label || '', log.created_at || nowIso()]
    );
  }
  for (const v of parsed.visitLogs || []) {
    await pool.query(
      `INSERT INTO visit_logs (id, source, path, status_code, is_bot, bot_name, user_agent, referrer, session_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.source === 'client' ? 'client' : 'server',
        v.path || '',
        v.status_code || null,
        v.is_bot ? 1 : 0,
        v.bot_name || null,
        v.user_agent || '',
        v.referrer || '',
        v.session_id || '',
        v.created_at || nowIso(),
      ]
    );
  }
  for (const user of parsed.adminUsers || []) {
    await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      [user.id, user.email, user.password_hash, user.created_at || nowIso()]
    );
  }

  if (parsed.settings) {
    const s = parsed.settings;
    await pool.query(
      `INSERT INTO settings (id, consultant_name, consultant_title, consultant_phone, consultant_whatsapp,
         consultant_email, consultant_photo, whatsapp_button_phone, notification_email, contact_email,
         contact_phone, contact_address, facebook_url, instagram_url, site_logo, site_favicon,
         google_site_verification, ga4_measurement_id, google_ads_id, noindex_site)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [
        s.consultant_name || '',
        s.consultant_title || '',
        s.consultant_phone || '',
        s.consultant_whatsapp || '',
        s.consultant_email || '',
        s.consultant_photo || '',
        s.whatsapp_button_phone || '',
        s.notification_email || '',
        s.contact_email || '',
        s.contact_phone || '',
        s.contact_address || '',
        s.facebook_url || '',
        s.instagram_url || '',
        s.site_logo || '',
        s.site_favicon || '',
        s.google_site_verification || '',
        s.ga4_measurement_id || '',
        s.google_ads_id || '',
        s.noindex_site === false ? 0 : 1,
      ]
    );
  }

  if (parsed.pageContent) {
    for (const [key, val] of Object.entries(parsed.pageContent)) {
      await pool.query(
        `INSERT INTO page_content (page_key, h1, p, seo_title, seo_description) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE h1 = VALUES(h1), p = VALUES(p), seo_title = VALUES(seo_title), seo_description = VALUES(seo_description)`,
        [key, val.h1 || '', val.p || '', val.seo_title || '', val.seo_description || '']
      );
    }
  }

  if (parsed.siteFiles) {
    for (const key of ['llms_txt', 'robots_txt']) {
      if (parsed.siteFiles[key] !== undefined) {
        await pool.query(
          `INSERT INTO site_files (file_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)`,
          [key, parsed.siteFiles[key]]
        );
      }
    }
  }

  console.log(
    `[db] Migrated ${tourCount} tour(s), ${(parsed.blogPosts || []).length} blog post(s) and related data from data.json into MySQL.`
  );
}

// Segment keywords reserved by the /tours URL scheme — a tour's slug can
// never equal one of these, or it would be indistinguishable from a
// /tours/:type or /tours/from-:departure filter page.
const TOUR_TYPES = ['package', 'daily', 'activity'];
const RESERVED_TOUR_SLUGS = new Set(['tours', 'package', 'daily', 'activities', 'activity']);
function isReservedTourSlug(slug) {
  return RESERVED_TOUR_SLUGS.has(slug) || slug.startsWith('from-');
}
function departureSlug(value) {
  return slugify(String(value || ''), { lower: true, strict: true });
}

async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const existing = await adminUsers.findByEmail(email);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    await adminUsers.create(email, hash);
    console.log(`[db] Admin user created: ${email}`);
  }
}

// --- Admin users ---
const adminUsers = {
  async findByEmail(email) {
    const e = String(email || '').toLowerCase().trim();
    const rows = await query('SELECT * FROM admin_users WHERE email = ? LIMIT 1', [e]);
    return rows[0] || null;
  },
  async create(email, passwordHash) {
    const [result] = await pool.query(
      'INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, ?)',
      [String(email).toLowerCase().trim(), passwordHash, nowIso()]
    );
    return { id: result.insertId, email: String(email).toLowerCase().trim(), password_hash: passwordHash };
  },
};

// --- Shared helpers for tour-like entries (tours, blog posts) ---
function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split('\n').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function normalizeImages(images) {
  return (images || [])
    .map((img, idx) => ({ id: idx + 1, url: typeof img === 'string' ? img : img.url, sort_order: idx }))
    .filter((img) => !!img.url);
}
function normalizeItinerary(itinerary) {
  return (itinerary || []).map((day, idx) => ({
    id: idx + 1,
    day_number: Number(day.day_number) || idx + 1,
    title: day.title || '',
    details: day.details || '',
    sort_order: idx,
  }));
}
function normalizeRoute(route) {
  return (route || [])
    .map((point, idx) => ({ id: idx + 1, name: point.name || '', lat: Number(point.lat), lng: Number(point.lng), sort_order: idx }))
    .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

// --- Cost & Pricing (Faz 2) ---
// Sabit Maliyetler (fixed costs) = vehicle_tiers (one tier selected by party
// size — e.g. Vito for up to 5 people, Sprinter for 6+) + fixed_costs (flat
// per-tour items, e.g. the guide). Role-based markup (see settings.
// agency_markup_percent / customer_markup_percent) applies ONLY to this
// fixed total. optional_costs (entrance fees, food, extras — normally
// per-person) are customer-selectable at booking time and are always
// charged at raw cost, with no markup. See server/lib/pricing.js for the
// actual price calculation, mirrored client-side in client/src/lib/pricing.js
// for the live admin preview.
const OPTIONAL_COST_CATEGORIES = ['entrance', 'food', 'extra', 'other'];
function normalizeVehicleTiers(tiers) {
  return (tiers || [])
    .map((t, idx) => ({
      id: idx + 1,
      min_people: Math.max(1, Number(t.min_people) || 1),
      max_people: t.max_people === '' || t.max_people === null || t.max_people === undefined ? null : Math.max(1, Number(t.max_people) || 1),
      vehicle_name: t.vehicle_name || '',
      cost: Number(t.cost) || 0,
      sort_order: idx,
    }))
    .filter((t) => t.vehicle_name)
    .sort((a, b) => a.min_people - b.min_people);
}
function normalizeFixedCosts(items) {
  return (items || [])
    .map((c, idx) => ({ id: idx + 1, name: c.name || '', cost: Number(c.cost) || 0, sort_order: idx }))
    .filter((c) => c.name);
}
function normalizeOptionalCosts(items) {
  return (items || [])
    .map((c, idx) => ({
      id: idx + 1,
      name: c.name || '',
      cost_per_person: Number(c.cost_per_person) || 0,
      category: OPTIONAL_COST_CATEGORIES.includes(c.category) ? c.category : 'other',
      sort_order: idx,
    }))
    .filter((c) => c.name);
}

function rowToTour(row) {
  if (!row) return row;
  return { ...row, price: Number(row.price), original_price: Number(row.original_price) };
}

const tours = {
  async listPublished() {
    const rows = await query("SELECT * FROM tours WHERE status = 'published' ORDER BY created_at DESC");
    return rows.map(rowToTour);
  },
  async listAll() {
    const rows = await query('SELECT * FROM tours ORDER BY created_at DESC');
    return rows.map(rowToTour);
  },
  async getById(id) {
    const rows = await query('SELECT * FROM tours WHERE id = ? LIMIT 1', [Number(id)]);
    return rowToTour(rows[0]) || null;
  },
  async getPublishedBySlug(slug) {
    const rows = await query("SELECT * FROM tours WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return rowToTour(rows[0]) || null;
  },
  async slugExists(slug, ignoreId) {
    const rows = await query('SELECT id FROM tours WHERE slug = ? AND id != ? LIMIT 1', [slug, Number(ignoreId) || 0]);
    return rows.length > 0;
  },
  async create(input) {
    const now = nowIso();
    const [result] = await pool.query(
      `INSERT INTO tours (slug, type, departure_point, title, summary, description, price, original_price,
         price_note, currency, duration_days, location, start_date, capacity, status, cover_image,
         languages, highlights, included, excluded, images, itinerary, route,
         vehicle_tiers, fixed_costs, optional_costs, seo_title, seo_description,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug,
        TOUR_TYPES.includes(input.type) ? input.type : 'package',
        input.departure_point || '',
        input.title || '',
        input.summary || '',
        input.description || '',
        Number(input.price) || 0,
        Number(input.original_price) || 0,
        input.price_note || '',
        input.currency || 'USD',
        Number(input.duration_days) || 1,
        input.location || '',
        input.start_date || '',
        Number(input.capacity) || 0,
        input.status === 'draft' ? 'draft' : 'published',
        input.cover_image || '',
        j(normalizeStringList(input.languages)),
        j(normalizeStringList(input.highlights)),
        j(normalizeStringList(input.included)),
        j(normalizeStringList(input.excluded)),
        j(normalizeImages(input.images)),
        j(normalizeItinerary(input.itinerary)),
        j(normalizeRoute(input.route)),
        j(normalizeVehicleTiers(input.vehicle_tiers)),
        j(normalizeFixedCosts(input.fixed_costs)),
        j(normalizeOptionalCosts(input.optional_costs)),
        input.seo_title || '',
        input.seo_description || '',
        now,
        now,
      ]
    );
    return tours.getById(result.insertId);
  },
  async update(id, input) {
    const existing = await tours.getById(id);
    if (!existing) return null;
    await pool.query(
      `UPDATE tours SET slug = ?, type = ?, departure_point = ?, title = ?, summary = ?, description = ?,
         price = ?, original_price = ?, price_note = ?, currency = ?, duration_days = ?, location = ?,
         start_date = ?, capacity = ?, status = ?, cover_image = ?, languages = ?, highlights = ?,
         included = ?, excluded = ?, images = ?, itinerary = ?, route = ?,
         vehicle_tiers = ?, fixed_costs = ?, optional_costs = ?, seo_title = ?,
         seo_description = ?, updated_at = ? WHERE id = ?`,
      [
        input.slug || existing.slug,
        TOUR_TYPES.includes(input.type) ? input.type : 'package',
        input.departure_point || '',
        input.title || '',
        input.summary || '',
        input.description || '',
        Number(input.price) || 0,
        Number(input.original_price) || 0,
        input.price_note || '',
        input.currency || 'USD',
        Number(input.duration_days) || 1,
        input.location || '',
        input.start_date || '',
        Number(input.capacity) || 0,
        input.status === 'draft' ? 'draft' : 'published',
        input.cover_image || '',
        j(normalizeStringList(input.languages)),
        j(normalizeStringList(input.highlights)),
        j(normalizeStringList(input.included)),
        j(normalizeStringList(input.excluded)),
        j(normalizeImages(input.images)),
        j(normalizeItinerary(input.itinerary)),
        j(normalizeRoute(input.route)),
        j(normalizeVehicleTiers(input.vehicle_tiers)),
        j(normalizeFixedCosts(input.fixed_costs)),
        j(normalizeOptionalCosts(input.optional_costs)),
        input.seo_title || '',
        input.seo_description || '',
        nowIso(),
        Number(id),
      ]
    );
    return tours.getById(id);
  },
  async remove(id) {
    const [result] = await pool.query('DELETE FROM tours WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  },
  async listPublishedByFilter({ type, departureSlug: depSlug } = {}) {
    const all = await tours.listPublished();
    return all.filter((t) => {
      if (type && t.type !== type) return false;
      if (depSlug && departureSlug(t.departure_point) !== depSlug) return false;
      return true;
    });
  },
  async distinctDeparturePoints() {
    const all = await tours.listPublished();
    const seen = new Map();
    all.forEach((t) => {
      const label = String(t.departure_point || '').trim();
      if (!label) return;
      const slug = departureSlug(label);
      if (!slug || seen.has(slug)) return;
      seen.set(slug, label);
    });
    return Array.from(seen.entries()).map(([slug, label]) => ({ slug, label }));
  },
};

// --- Transfer Routes ---
// Same Cost & Pricing shape as tours (vehicle_tiers/fixed_costs/optional_costs,
// see server/lib/pricing.js) — a transfer route "IS a product" exactly like a
// tour is, so it reuses the identical fixed-cost + role-based-markup formula
// and the same admin CostPricingEditor component.
const transferRoutes = {
  async listPublished() {
    return query("SELECT * FROM transfer_routes WHERE status = 'published' ORDER BY pickup_location ASC");
  },
  async listAll() {
    return query('SELECT * FROM transfer_routes ORDER BY created_at DESC');
  },
  async getById(id) {
    const rows = await query('SELECT * FROM transfer_routes WHERE id = ? LIMIT 1', [Number(id)]);
    return rows[0] || null;
  },
  async getPublishedBySlug(slug) {
    const rows = await query("SELECT * FROM transfer_routes WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return rows[0] || null;
  },
  async slugExists(slug, ignoreId) {
    const rows = await query('SELECT id FROM transfer_routes WHERE slug = ? AND id != ? LIMIT 1', [slug, Number(ignoreId) || 0]);
    return rows.length > 0;
  },
  async create(input) {
    const now = nowIso();
    const [result] = await pool.query(
      `INSERT INTO transfer_routes (slug, title, pickup_location, dropoff_location, duration_text,
         distance_km, summary, description, currency, status, vehicle_tiers, fixed_costs, optional_costs,
         seo_title, seo_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug,
        input.title || '',
        input.pickup_location || '',
        input.dropoff_location || '',
        input.duration_text || '',
        Number(input.distance_km) || 0,
        input.summary || '',
        input.description || '',
        input.currency || 'EUR',
        input.status === 'draft' ? 'draft' : 'published',
        j(normalizeVehicleTiers(input.vehicle_tiers)),
        j(normalizeFixedCosts(input.fixed_costs)),
        j(normalizeOptionalCosts(input.optional_costs)),
        input.seo_title || '',
        input.seo_description || '',
        now,
        now,
      ]
    );
    return transferRoutes.getById(result.insertId);
  },
  async update(id, input) {
    const existing = await transferRoutes.getById(id);
    if (!existing) return null;
    await pool.query(
      `UPDATE transfer_routes SET slug = ?, title = ?, pickup_location = ?, dropoff_location = ?,
         duration_text = ?, distance_km = ?, summary = ?, description = ?, currency = ?, status = ?,
         vehicle_tiers = ?, fixed_costs = ?, optional_costs = ?, seo_title = ?, seo_description = ?,
         updated_at = ? WHERE id = ?`,
      [
        input.slug || existing.slug,
        input.title || '',
        input.pickup_location || '',
        input.dropoff_location || '',
        input.duration_text || '',
        Number(input.distance_km) || 0,
        input.summary || '',
        input.description || '',
        input.currency || 'EUR',
        input.status === 'draft' ? 'draft' : 'published',
        j(normalizeVehicleTiers(input.vehicle_tiers)),
        j(normalizeFixedCosts(input.fixed_costs)),
        j(normalizeOptionalCosts(input.optional_costs)),
        input.seo_title || '',
        input.seo_description || '',
        nowIso(),
        Number(id),
      ]
    );
    return transferRoutes.getById(id);
  },
  async remove(id) {
    const [result] = await pool.query('DELETE FROM transfer_routes WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  },
  async distinctLocations() {
    const rows = await transferRoutes.listPublished();
    const set = new Set();
    rows.forEach((r) => {
      if (r.pickup_location) set.add(r.pickup_location);
      if (r.dropoff_location) set.add(r.dropoff_location);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },
};

// --- Availability (Faz 6 — Transfer Routes; reusable later for Tours) ---
// A date with no row is treated as 'available' by default — the admin only
// needs to add rows for dates they want to mark 'on_request' or 'closed',
// not for every single available day.
const AVAILABILITY_STATUSES = ['available', 'on_request', 'closed'];
const availability = {
  async getForItem(itemType, itemId, { from, to } = {}) {
    const params = [itemType, Number(itemId)];
    let sql = 'SELECT date, status FROM availability WHERE item_type = ? AND item_id = ?';
    if (from) {
      sql += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND date <= ?';
      params.push(to);
    }
    const rows = await query(sql, params);
    const out = {};
    rows.forEach((r) => {
      out[r.date] = r.status;
    });
    return out;
  },
  async setForItem(itemType, itemId, date, status) {
    const s = AVAILABILITY_STATUSES.includes(status) ? status : 'available';
    if (s === 'available') {
      // No row = available (the default) — deleting keeps the table small
      // and keeps "available" unambiguous even if it's later re-added.
      await pool.query('DELETE FROM availability WHERE item_type = ? AND item_id = ? AND date = ?', [itemType, Number(itemId), date]);
      return { date, status: s };
    }
    await pool.query(
      `INSERT INTO availability (item_type, item_id, date, status) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [itemType, Number(itemId), date, s]
    );
    return { date, status: s };
  },
  async removeForItem(itemType, itemId) {
    await pool.query('DELETE FROM availability WHERE item_type = ? AND item_id = ?', [itemType, Number(itemId)]);
  },
};

// --- Blog ---
const blogPosts = {
  async listPublished() {
    return query("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC");
  },
  async listAll() {
    return query('SELECT * FROM blog_posts ORDER BY created_at DESC');
  },
  async getById(id) {
    const rows = await query('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [Number(id)]);
    return rows[0] || null;
  },
  async getPublishedBySlug(slug) {
    const rows = await query("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return rows[0] || null;
  },
  async slugExists(slug, ignoreId) {
    const rows = await query('SELECT id FROM blog_posts WHERE slug = ? AND id != ? LIMIT 1', [slug, Number(ignoreId) || 0]);
    return rows.length > 0;
  },
  async create(input) {
    const now = nowIso();
    const [result] = await pool.query(
      `INSERT INTO blog_posts (slug, title, excerpt, content, cover_image, author, status, seo_title,
         seo_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug,
        input.title || '',
        input.excerpt || '',
        input.content || '',
        input.cover_image || '',
        input.author || '',
        input.status === 'draft' ? 'draft' : 'published',
        input.seo_title || '',
        input.seo_description || '',
        now,
        now,
      ]
    );
    return blogPosts.getById(result.insertId);
  },
  async update(id, input) {
    const existing = await blogPosts.getById(id);
    if (!existing) return null;
    await pool.query(
      `UPDATE blog_posts SET slug = ?, title = ?, excerpt = ?, content = ?, cover_image = ?, author = ?,
         status = ?, seo_title = ?, seo_description = ?, updated_at = ? WHERE id = ?`,
      [
        input.slug || existing.slug,
        input.title || '',
        input.excerpt || '',
        input.content || '',
        input.cover_image || '',
        input.author || '',
        input.status === 'draft' ? 'draft' : 'published',
        input.seo_title || '',
        input.seo_description || '',
        nowIso(),
        Number(id),
      ]
    );
    return blogPosts.getById(id);
  },
  async remove(id) {
    const [result] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  },
};

// --- Contact messages ---
// item_type is one of: 'package_tour' | 'daily_tour' | 'activity' | null —
// all three legacy strings resolve against the single `tours` table (kept
// as three keys so old contactMessages rows, and the ContactForm on tour
// detail pages, keep working unchanged).
const ITEM_COLLECTIONS = {
  package_tour: () => tours,
  daily_tour: () => tours,
  activity: () => tours,
  transfer_route: () => transferRoutes,
};

const contactMessages = {
  async create(input) {
    const created_at = nowIso();
    const item_type = ITEM_COLLECTIONS[input.item_type] ? input.item_type : null;
    const item_id = input.item_id ? Number(input.item_id) : null;
    const [result] = await pool.query(
      `INSERT INTO contact_messages (item_type, item_id, name, email, phone, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
      [item_type, item_id, input.name, input.email, input.phone || '', input.message || '', created_at]
    );
    let item_title = null;
    if (item_id && item_type) {
      const item = await ITEM_COLLECTIONS[item_type]().getById(item_id);
      item_title = item ? item.title : null;
    }
    return { id: result.insertId, item_type, item_id, name: input.name, email: input.email, phone: input.phone || '', message: input.message || '', status: 'new', created_at, item_title };
  },
  async listWithItemTitle() {
    const rows = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    const out = [];
    for (const m of rows) {
      let item_title = null;
      if (m.item_id && m.item_type && ITEM_COLLECTIONS[m.item_type]) {
        const item = await ITEM_COLLECTIONS[m.item_type]().getById(m.item_id);
        item_title = item ? item.title : null;
      }
      out.push({ ...m, item_title });
    }
    return out;
  },
  async markRead(id) {
    const [result] = await pool.query("UPDATE contact_messages SET status = 'read' WHERE id = ?", [Number(id)]);
    return result.affectedRows > 0;
  },
};

// --- Media Library ---
const mediaFolders = {
  async listAll() {
    return query('SELECT * FROM media_folders ORDER BY name ASC');
  },
  async getById(id) {
    const rows = await query('SELECT * FROM media_folders WHERE id = ? LIMIT 1', [Number(id)]);
    return rows[0] || null;
  },
  async create(input) {
    const [result] = await pool.query('INSERT INTO media_folders (name, parent_id, created_at) VALUES (?, ?, ?)', [
      String(input.name).trim(),
      input.parent_id ? Number(input.parent_id) : null,
      nowIso(),
    ]);
    return mediaFolders.getById(result.insertId);
  },
  async remove(id) {
    const numId = Number(id);
    const [subfolders] = await pool.query('SELECT COUNT(*) AS c FROM media_folders WHERE parent_id = ?', [numId]);
    const [items] = await pool.query('SELECT COUNT(*) AS c FROM media_items WHERE folder_id = ?', [numId]);
    if (Number(subfolders[0].c) > 0 || Number(items[0].c) > 0) return false;
    const [result] = await pool.query('DELETE FROM media_folders WHERE id = ?', [numId]);
    return result.affectedRows > 0;
  },
};

const mediaItems = {
  async listByFolder(folderId) {
    if (folderId) return query('SELECT * FROM media_items WHERE folder_id = ? ORDER BY created_at DESC', [Number(folderId)]);
    return query('SELECT * FROM media_items WHERE folder_id IS NULL ORDER BY created_at DESC');
  },
  async listAll() {
    return query('SELECT * FROM media_items ORDER BY created_at DESC');
  },
  async getById(id) {
    const rows = await query('SELECT * FROM media_items WHERE id = ? LIMIT 1', [Number(id)]);
    return rows[0] || null;
  },
  async create(input) {
    const [result] = await pool.query(
      `INSERT INTO media_items (url, filename, original_name, folder_id, size, width, height, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.url,
        input.filename,
        input.original_name || '',
        input.folder_id ? Number(input.folder_id) : null,
        input.size || 0,
        input.width || null,
        input.height || null,
        nowIso(),
      ]
    );
    return mediaItems.getById(result.insertId);
  },
  async remove(id) {
    const [result] = await pool.query('DELETE FROM media_items WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  },
};

// --- Settings ---
function extractSiteVerificationCode(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  const match = str.match(/content=["']([^"']+)["']/i);
  return match ? match[1].trim() : str;
}
function extractPrefixedId(raw, prefix) {
  if (!raw) return '';
  const str = String(raw).trim();
  const match = str.match(new RegExp(`${prefix}-[A-Za-z0-9]+`));
  return match ? match[0] : str;
}

function rowToSettings(row) {
  const { id, noindex_site, sample_content_seeded, sample_transfer_seeded, agency_markup_percent, customer_markup_percent, ...rest } = row;
  return {
    ...rest,
    noindex_site: !!noindex_site,
    agency_markup_percent: Number(agency_markup_percent),
    customer_markup_percent: Number(customer_markup_percent),
  };
}

const settings = {
  async get() {
    const rows = await query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    if (rows[0]) return rowToSettings(rows[0]);
    // No row yet (brand-new database) — insert the default row once.
    await pool.query('INSERT INTO settings (id) VALUES (1)');
    const rows2 = await query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    return rowToSettings(rows2[0]);
  },
  async update(input) {
    await settings.get(); // ensures the row exists
    await pool.query(
      `UPDATE settings SET consultant_name=?, consultant_title=?, consultant_phone=?, consultant_whatsapp=?,
         consultant_email=?, consultant_photo=?, whatsapp_button_phone=?, notification_email=?, contact_email=?,
         contact_phone=?, contact_address=?, facebook_url=?, instagram_url=?, site_logo=?, site_favicon=?,
         google_site_verification=?, ga4_measurement_id=?, google_ads_id=?, noindex_site=?,
         agency_markup_percent=?, customer_markup_percent=? WHERE id = 1`,
      [
        input.consultant_name || '',
        input.consultant_title || '',
        input.consultant_phone || '',
        input.consultant_whatsapp || '',
        input.consultant_email || '',
        input.consultant_photo || '',
        input.whatsapp_button_phone || '',
        input.notification_email || '',
        input.contact_email || '',
        input.contact_phone || '',
        input.contact_address || '',
        input.facebook_url || '',
        input.instagram_url || '',
        input.site_logo || '',
        input.site_favicon || '',
        extractSiteVerificationCode(input.google_site_verification),
        extractPrefixedId(input.ga4_measurement_id, 'G'),
        extractPrefixedId(input.google_ads_id, 'AW'),
        input.noindex_site ? 1 : 0,
        Number(input.agency_markup_percent) || 0,
        Number(input.customer_markup_percent) || 0,
      ]
    );
    return settings.get();
  },
};

// --- Editable page content ---
const PAGE_CONTENT_DEFAULTS = {
  home: {
    h1: 'Find your dream tour and hit the road',
    p: 'Explore our carefully curated package tours, daily tours and activities. Detailed itineraries, transparent pricing and easy communication.',
    seo_title: '',
    seo_description: '',
  },
  tours: {
    h1: 'Tours',
    p: "Explore our package tours, daily tours and standalone activities — filter by type or by where you're departing from.",
    seo_title: '',
    seo_description: '',
  },
  blog: { h1: 'Blog', p: 'Travel tips, destination guides and stories from around Turkey.', seo_title: '', seo_description: '' },
  aboutUs: {
    h1: 'About Us',
    p: 'We are a Turkey-based travel company dedicated to helping you discover the country’s most remarkable destinations.',
    seo_title: '',
    seo_description: '',
  },
  contact: {
    h1: 'Contact',
    p: "Questions or special requests? Send us a message and we'll get back to you as soon as possible.",
    seo_title: '',
    seo_description: '',
  },
  terms: {
    h1: 'Terms and Conditions',
    p: 'Please read these terms carefully before booking a tour or activity with us.',
    seo_title: '',
    seo_description: '',
  },
  privacy: {
    h1: 'Privacy Policy',
    p: 'How we collect, use and protect the information you share with us.',
    seo_title: '',
    seo_description: '',
  },
  faq: {
    h1: 'Frequently Asked Questions',
    p: "Answers to the questions we hear most often. Can't find what you're looking for? Reach out through our contact page.",
    seo_title: '',
    seo_description: '',
  },
};

const pageContent = {
  async get() {
    const rows = await query('SELECT * FROM page_content');
    const byKey = Object.fromEntries(rows.map((r) => [r.page_key, r]));
    const merged = {};
    for (const key of Object.keys(PAGE_CONTENT_DEFAULTS)) {
      merged[key] = { ...PAGE_CONTENT_DEFAULTS[key], ...(byKey[key] ? { h1: byKey[key].h1, p: byKey[key].p, seo_title: byKey[key].seo_title, seo_description: byKey[key].seo_description } : {}) };
    }
    return merged;
  },
  async update(input) {
    const current = await pageContent.get();
    for (const key of Object.keys(PAGE_CONTENT_DEFAULTS)) {
      const b = (input && input[key]) || {};
      const next = {
        h1: b.h1 !== undefined ? String(b.h1) : current[key].h1,
        p: b.p !== undefined ? String(b.p) : current[key].p,
        seo_title: b.seo_title !== undefined ? String(b.seo_title) : current[key].seo_title,
        seo_description: b.seo_description !== undefined ? String(b.seo_description) : current[key].seo_description,
      };
      await pool.query(
        `INSERT INTO page_content (page_key, h1, p, seo_title, seo_description) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE h1 = VALUES(h1), p = VALUES(p), seo_title = VALUES(seo_title), seo_description = VALUES(seo_description)`,
        [key, next.h1, next.p, next.seo_title, next.seo_description]
      );
    }
    return pageContent.get();
  },
};

// --- Redirects ---
function normalizePath(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname;
  } catch {
    // ignore, fall through and treat as a plain path
  }
  if (!s.startsWith('/')) s = `/${s}`;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

const redirects = {
  async listAll() {
    return query('SELECT * FROM redirects ORDER BY created_at DESC');
  },
  async getById(id) {
    const rows = await query('SELECT * FROM redirects WHERE id = ? LIMIT 1', [Number(id)]);
    return rows[0] || null;
  },
  async findByPath(pathname) {
    const target = normalizePath(pathname);
    const rows = await query('SELECT * FROM redirects WHERE from_path = ? LIMIT 1', [target]);
    return rows[0] || null;
  },
  async create(input) {
    const from_path = normalizePath(input.from_path);
    const to_path = normalizePath(input.to_path);
    if (!from_path || !to_path) throw new Error('Both paths are required.');
    if (from_path === to_path) throw new Error('The two paths must be different.');
    const existing = await query('SELECT id FROM redirects WHERE from_path = ? LIMIT 1', [from_path]);
    if (existing.length) throw new Error('A redirect from that path already exists.');
    const status_code = Number(input.status_code) === 302 ? 302 : 301;
    const [result] = await pool.query('INSERT INTO redirects (from_path, to_path, status_code, created_at) VALUES (?, ?, ?, ?)', [
      from_path,
      to_path,
      status_code,
      nowIso(),
    ]);
    return redirects.getById(result.insertId);
  },
  async update(id, input) {
    const existing = await redirects.getById(id);
    if (!existing) return null;
    const from_path = normalizePath(input.from_path);
    const to_path = normalizePath(input.to_path);
    if (!from_path || !to_path) throw new Error('Both paths are required.');
    if (from_path === to_path) throw new Error('The two paths must be different.');
    const dupe = await query('SELECT id FROM redirects WHERE from_path = ? AND id != ? LIMIT 1', [from_path, Number(id)]);
    if (dupe.length) throw new Error('A redirect from that path already exists.');
    const status_code = Number(input.status_code) === 302 ? 302 : 301;
    await pool.query('UPDATE redirects SET from_path = ?, to_path = ?, status_code = ? WHERE id = ?', [
      from_path,
      to_path,
      status_code,
      Number(id),
    ]);
    return redirects.getById(id);
  },
  async remove(id) {
    const [result] = await pool.query('DELETE FROM redirects WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  },
};

// --- Admin activity log ---
const MAX_ADMIN_LOGS = 3000;
const adminLogs = {
  async create(input) {
    const created_at = nowIso();
    const [result] = await pool.query(
      'INSERT INTO admin_logs (admin_email, action, entity_type, entity_label, created_at) VALUES (?, ?, ?, ?, ?)',
      [input.admin_email || '', input.action || '', input.entity_type || '', input.entity_label || '', created_at]
    );
    // Low-volume table (admin actions only) — trim on every insert is cheap.
    await pool.query(
      `DELETE FROM admin_logs WHERE id NOT IN (SELECT id FROM (SELECT id FROM admin_logs ORDER BY id DESC LIMIT ?) t)`,
      [MAX_ADMIN_LOGS]
    );
    return { id: result.insertId, ...input, created_at };
  },
  async listRecent(limit) {
    const n = Math.min(Number(limit) || 100, 500);
    return query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ?', [n]);
  },
};

// --- Site traffic / crawler log ---
const MAX_VISIT_LOGS = 8000;
const visitLogs = {
  async create(input) {
    const created_at = nowIso();
    const [result] = await pool.query(
      `INSERT INTO visit_logs (source, path, status_code, is_bot, bot_name, user_agent, referrer, session_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.source === 'client' ? 'client' : 'server',
        input.path || '',
        input.status_code || null,
        input.is_bot ? 1 : 0,
        input.bot_name || null,
        input.user_agent || '',
        input.referrer || '',
        input.session_id || '',
        created_at,
      ]
    );
    // Higher-volume table (every page view) — trim probabilistically so the
    // cap-enforcing query doesn't run on every single insert.
    if (Math.random() < 0.02) {
      await pool.query(
        `DELETE FROM visit_logs WHERE id NOT IN (SELECT id FROM (SELECT id FROM visit_logs ORDER BY id DESC LIMIT ?) t)`,
        [MAX_VISIT_LOGS]
      );
    }
    return { id: result.insertId, ...input, created_at };
  },
  async listRecent({ limit, onlyBots, onlyHuman, onlyErrors } = {}) {
    const clauses = [];
    const params = [];
    if (onlyBots) clauses.push('is_bot = 1');
    if (onlyHuman) clauses.push('is_bot = 0');
    if (onlyErrors) clauses.push('status_code >= 400');
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const n = Math.min(Number(limit) || 100, 500);
    return query(`SELECT * FROM visit_logs ${where} ORDER BY created_at DESC LIMIT ?`, [...params, n]);
  },
  async summary() {
    const [totalRows] = await Promise.all([query("SELECT COUNT(*) AS c FROM visit_logs WHERE source = 'server'")]);
    const totalVisits = Number(totalRows[0].c);
    const [botRows] = await Promise.all([query("SELECT COUNT(*) AS c FROM visit_logs WHERE source = 'server' AND is_bot = 1")]);
    const botVisits = Number(botRows[0].c);
    const [errorRows] = await Promise.all([
      query("SELECT COUNT(*) AS c FROM visit_logs WHERE source = 'server' AND status_code >= 400"),
    ]);
    const errorCount = Number(errorRows[0].c);
    const topBotsRows = await query(
      `SELECT COALESCE(bot_name, 'Unknown Bot') AS name, COUNT(*) AS count FROM visit_logs
       WHERE source = 'server' AND is_bot = 1 GROUP BY name ORDER BY count DESC LIMIT 10`
    );
    const sessionRows = await query(
      `SELECT session_id, COUNT(*) AS pages, MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
       FROM visit_logs WHERE source = 'client' AND session_id != '' GROUP BY session_id ORDER BY last_seen DESC LIMIT 50`
    );
    const [sessionCountRows] = await Promise.all([
      query("SELECT COUNT(DISTINCT session_id) AS c FROM visit_logs WHERE source = 'client' AND session_id != ''"),
    ]);
    const sessionCount = Number(sessionCountRows[0].c);
    const [avgRows] = await Promise.all([
      query(
        `SELECT AVG(pages) AS avg_pages FROM (
           SELECT COUNT(*) AS pages FROM visit_logs WHERE source = 'client' AND session_id != '' GROUP BY session_id
         ) t`
      ),
    ]);
    const avgPagesPerSession = avgRows[0].avg_pages ? Math.round(Number(avgRows[0].avg_pages) * 10) / 10 : 0;

    return {
      totalVisits,
      botVisits,
      humanVisits: totalVisits - botVisits,
      errorCount,
      topBots: topBotsRows.map((r) => ({ name: r.name, count: Number(r.count) })),
      sessionCount,
      avgPagesPerSession,
      recentSessions: sessionRows.map((r) => ({ ...r, pages: Number(r.pages) })),
    };
  },
};

// --- Site files (llms.txt, robots.txt) ---
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4000').replace(/\/$/, '');
const SITE_FILE_DEFAULTS = {
  llms_txt: `# Pamukkale GuideBook

> A Turkey-based travel company offering Package Tours (multi-day), Daily
> Tours (single-day), and standalone Activities, plus a travel blog.

## Site Structure

- /tours/ — every tour and activity in one listing, filterable by type and
  by departure point. Each individual tour has its own page at
  /tours/[slug]/.
- /tours/package/ — multi-day, all-inclusive tour packages only, listed
  with price, duration, itinerary and included/excluded items.
- /tours/daily/ — single-day guided tours only.
- /tours/activities/ — standalone activities and experiences only (e.g.
  hot air balloon rides, cooking classes).
- /tours/from-[departure-point]/ — tours filtered by where they depart
  from (e.g. /tours/from-kusadasi/). Type and departure filters can combine,
  e.g. /tours/daily/from-kusadasi/.
- /blog/ — travel tips and destination guides, with individual posts at
  /blog/[slug]/.
- /about-us/ — company information.
- /contact/ — contact form for enquiries about any tour or activity.
- /faq/ — frequently asked questions.
- /terms-and-conditions/ and /privacy-policy/ — legal pages.

## Content Freshness

Package tours, daily tours, activities, blog posts and the headline/intro
text on every page are managed by the site owner through a private admin
panel (login required) and can change at any time — always prefer live data
fetched from this site over cached or previously seen content.

## Sitemap

A machine-readable sitemap is available at /sitemap.xml.
`,
  robots_txt: `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`,
};

const siteFiles = {
  async get() {
    const rows = await query('SELECT * FROM site_files');
    const byKey = Object.fromEntries(rows.map((r) => [r.file_key, r.content]));
    return {
      llms_txt: byKey.llms_txt !== undefined ? byKey.llms_txt : SITE_FILE_DEFAULTS.llms_txt,
      robots_txt: byKey.robots_txt !== undefined ? byKey.robots_txt : SITE_FILE_DEFAULTS.robots_txt,
    };
  },
  async update(input) {
    const current = await siteFiles.get();
    const next = {
      llms_txt: input.llms_txt !== undefined ? String(input.llms_txt) : current.llms_txt,
      robots_txt: input.robots_txt !== undefined ? String(input.robots_txt) : current.robots_txt,
    };
    for (const key of ['llms_txt', 'robots_txt']) {
      await pool.query(
        `INSERT INTO site_files (file_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)`,
        [key, next[key]]
      );
    }
    return siteFiles.get();
  },
};

// --- Startup sequence ---
// Called once from index.js before the server starts accepting requests:
// creates the schema if it doesn't exist yet, imports data.json on a
// first-ever run against a fresh database, and makes sure the configured
// admin account exists.
// --- One-time sample/preview content seed ---
// Fills the site with a few example tours (covering all three types, and
// demonstrating the new Faz 2 cost/pricing fields) so the owner can preview
// pages and spot issues before entering real data. Guarded by
// settings.sample_content_seeded (a permanent flag on the single settings
// row, NOT by whether the sample tours still exist) specifically so that
// deleting these tours from Admin > Tours later — once real data is being
// entered — is final: they will never be silently recreated by a later
// deploy/restart.
async function seedSampleContentIfNeeded() {
  await settings.get(); // ensures the settings row exists
  const rows = await query('SELECT sample_content_seeded FROM settings WHERE id = 1 LIMIT 1');
  if (rows[0] && Number(rows[0].sample_content_seeded) > 0) return;

  const sampleTours = [
    {
      title: 'Efes Antik Kenti Turu (Örnek İçerik)',
      type: 'daily',
      departure_point: 'Kuşadası',
      summary: 'Efes Antik Kenti, Meryem Ana Evi ve Şirince köyünü kapsayan özel günübirlik tur.',
      description:
        'Bu bir örnek/önizleme içeriğidir — gerçek verilerinizi girmeye başladığınızda Admin > Turlar üzerinden silebilirsiniz, tekrar oluşturulmaz.\n\n' +
        'Efes Antik Kenti, dünyanın en iyi korunmuş antik kentlerinden biridir. Bu özel (private) turda Celsus Kütüphanesi, Büyük Tiyatro ve Aşkı Yolu\'nu profesyonel rehberiniz eşliğinde gezersiniz.',
      price: 215,
      original_price: 0,
      price_note: '1 kişi için örnek fiyat — Maliyet ve Fiyatlandırma sekmesinden hesaplanır',
      currency: 'EUR',
      duration_days: 1,
      location: 'Efes / Selçuk',
      start_date: '',
      capacity: 16,
      status: 'published',
      languages: ['TR', 'EN'],
      highlights: ['Efes Antik Kenti', 'Meryem Ana Evi', 'Şirince Köyü'],
      included: ['Profesyonel Rehber', 'Ulaşım (Araç)'],
      excluded: ['Giriş Ücretleri (isteğe bağlı olarak eklenebilir)', 'Öğle Yemeği (isteğe bağlı olarak eklenebilir)'],
      images: [],
      itinerary: [
        { day_number: 1, title: 'Efes Antik Kenti ve Çevresi', details: 'Otelden alış, Efes Antik Kenti, Meryem Ana Evi, Şirince köyü ve otele dönüş.' },
      ],
      route: [],
      vehicle_tiers: [
        { min_people: 1, max_people: 5, vehicle_name: 'Vito', cost: 100 },
        { min_people: 6, max_people: 16, vehicle_name: 'Sprinter', cost: 150 },
      ],
      fixed_costs: [{ name: 'Rehber', cost: 100 }],
      optional_costs: [
        { name: 'Yemek', cost_per_person: 10, category: 'food' },
        { name: 'Efes Giriş', cost_per_person: 5, category: 'entrance' },
      ],
      seo_title: '',
      seo_description: '',
    },
    {
      title: 'Kapadokya ve Pamukkale Turu - 3 Gün (Örnek İçerik)',
      type: 'package',
      departure_point: 'Pamukkale',
      summary: 'Kapadokya\'nın peri bacaları ve Pamukkale\'nin travertenlerini birleştiren 3 günlük paket tur.',
      description:
        'Bu bir örnek/önizleme içeriğidir — gerçek verilerinizi girmeye başladığınızda Admin > Turlar üzerinden silebilirsiniz, tekrar oluşturulmaz.\n\n' +
        'Türkiye\'nin en ikonik iki destinasyonunu bir arada keşfedin: Kapadokya\'nın eşsiz peri bacaları ve balon turu imkanı, Pamukkale\'nin bembeyaz travertenleri ve antik Hierapolis kenti.',
      price: 450,
      original_price: 520,
      price_note: 'Kişi başı, çift kişilik oda esaslı',
      currency: 'EUR',
      duration_days: 3,
      location: 'Kapadokya / Pamukkale',
      start_date: '',
      capacity: 16,
      status: 'published',
      languages: ['TR', 'EN', 'DE'],
      highlights: ['Kapadokya Peri Bacaları', 'Pamukkale Travertenleri', 'Hierapolis Antik Kenti'],
      included: ['Profesyonel Rehber', 'Ulaşım (Araç)', 'Konaklama (2 gece)'],
      excluded: ['Balon Turu (isteğe bağlı olarak eklenebilir)', 'Öğle Yemekleri (isteğe bağlı olarak eklenebilir)'],
      images: [],
      itinerary: [
        { day_number: 1, title: 'Kapadokya\'ya Varış', details: 'Karşılama, otele yerleşme, Ürgüp ve Göreme çevresinde şehir turu.' },
        { day_number: 2, title: 'Kapadokya Turu', details: 'İsteğe bağlı balon turu (gün doğumu), Yeraltı Şehri, Peri Bacaları vadi turları.' },
        { day_number: 3, title: 'Pamukkale\'ye Geçiş', details: 'Pamukkale travertenleri ve Hierapolis Antik Kenti ziyareti.' },
      ],
      route: [],
      vehicle_tiers: [
        { min_people: 1, max_people: 5, vehicle_name: 'Vito', cost: 300 },
        { min_people: 6, max_people: 16, vehicle_name: 'Sprinter', cost: 450 },
      ],
      fixed_costs: [{ name: 'Rehber (3 Gün)', cost: 250 }],
      optional_costs: [
        { name: 'Balon Turu', cost_per_person: 180, category: 'extra' },
        { name: 'Öğle Yemeği (günlük)', cost_per_person: 15, category: 'food' },
        { name: 'Hierapolis Giriş', cost_per_person: 20, category: 'entrance' },
      ],
      seo_title: '',
      seo_description: '',
    },
    {
      title: 'Pamukkale Termal Havuzları ve Cleopatra Havuzu (Örnek İçerik)',
      type: 'activity',
      departure_point: 'Pamukkale',
      summary: 'Beyaz travertenler üzerinde yürüyüş ve Cleopatra\'nın antik termal havuzunda yüzme imkanı.',
      description:
        'Bu bir örnek/önizleme içeriğidir — gerçek verilerinizi girmeye başladığınızda Admin > Turlar üzerinden silebilirsiniz, tekrar oluşturulmaz.\n\n' +
        'Pamukkale\'nin ünlü beyaz travertenlerinde yürüyüş yapın ve isteğe bağlı olarak Cleopatra Havuzu\'nda tarihi bir deneyim yaşayın.',
      price: 35,
      original_price: 0,
      price_note: 'Kişi başı',
      currency: 'EUR',
      duration_days: 1,
      location: 'Pamukkale',
      start_date: '',
      capacity: 20,
      status: 'published',
      languages: ['TR', 'EN'],
      highlights: ['Pamukkale Travertenleri', 'Cleopatra Havuzu'],
      included: ['Rehber Eşliğinde Gezi'],
      excluded: ['Pamukkale Giriş Ücreti (isteğe bağlı olarak eklenebilir)', 'Cleopatra Havuzu Girişi (isteğe bağlı olarak eklenebilir)'],
      images: [],
      itinerary: [],
      route: [],
      vehicle_tiers: [{ min_people: 1, max_people: 20, vehicle_name: 'Minibüs', cost: 80 }],
      fixed_costs: [{ name: 'Rehber', cost: 60 }],
      optional_costs: [
        { name: 'Pamukkale Giriş', cost_per_person: 5, category: 'entrance' },
        { name: 'Cleopatra Havuzu Girişi', cost_per_person: 12, category: 'entrance' },
      ],
      seo_title: '',
      seo_description: '',
    },
  ];

  for (const t of sampleTours) {
    const rawSlug = slugify(t.title, { lower: true, strict: true });
    let slug = isReservedTourSlug(rawSlug) ? `tour-${rawSlug}` : rawSlug;
    let i = 2;
    while ((await tours.slugExists(slug)) || isReservedTourSlug(slug)) {
      slug = `${rawSlug}-${i++}`;
    }
    await tours.create({ ...t, slug });
  }

  await pool.query('UPDATE settings SET sample_content_seeded = 1 WHERE id = 1');
  console.log(
    `[db] Seeded ${sampleTours.length} sample preview tour(s). Delete them from Admin > Tours whenever you like — they will not be recreated.`
  );
}

// --- One-time sample Transfer Route seed (Faz 6) ---
// Same guard pattern as seedSampleContentIfNeeded above (a permanent
// settings flag, not row existence) so deleting these later is final.
async function seedSampleTransferIfNeeded() {
  await settings.get();
  const rows = await query('SELECT sample_transfer_seeded FROM settings WHERE id = 1 LIMIT 1');
  if (rows[0] && Number(rows[0].sample_transfer_seeded) > 0) return;

  const sampleRoutes = [
    {
      title: 'Izmir Cruise Port to Pamukkale Private Transfer Service (Örnek İçerik)',
      pickup_location: 'Izmir Cruise Port',
      dropoff_location: 'Pamukkale',
      duration_text: '2hr 30min',
      distance_km: 210,
      summary: 'Experience a luxurious, safe, and stress-free journey between Izmir Cruise Port and Pamukkale.',
      description:
        'Bu bir örnek/önizleme içeriğidir — gerçek verilerinizi girmeye başladığınızda Admin > Transfers üzerinden silebilirsiniz, tekrar oluşturulmaz.\n\n' +
        'We prioritize your comfort and safety throughout your journey. Upon arrival, we greet you and ensure you arrive safely at your destination. Our vehicle fleet is fully air-conditioned and comfortable, with options tailored to your group size:\n\n' +
        'For 1-4 passengers: Comfortable Mercedes Vito or similar vehicles\nFor 5-12 passengers: Spacious Mercedes Sprinter or similar coaches',
      currency: 'EUR',
      status: 'published',
      vehicle_tiers: [
        { min_people: 1, max_people: 4, vehicle_name: 'Vito', cost: 151 },
        { min_people: 5, max_people: 12, vehicle_name: 'Sprinter', cost: 216 },
      ],
      fixed_costs: [],
      optional_costs: [
        { name: 'Child Seat', cost_per_person: 8, category: 'extra' },
        { name: 'Meet & Greet Sign', cost_per_person: 0, category: 'extra' },
      ],
      seo_title: '',
      seo_description: '',
    },
    {
      title: 'Bergama to Izmir Cruise Port Private Transfer Service (Örnek İçerik)',
      pickup_location: 'Bergama',
      dropoff_location: 'Izmir Cruise Port',
      duration_text: '1hr 30min',
      distance_km: 115,
      summary: 'A comfortable, direct private transfer between Bergama (Pergamon) and Izmir Cruise Port.',
      description:
        'Bu bir örnek/önizleme içeriğidir — gerçek verilerinizi girmeye başladığınızda Admin > Transfers üzerinden silebilirsiniz, tekrar oluşturulmaz.\n\n' +
        'This route covers approximately 115 kilometers and typically takes around 1 hour 30 minutes to complete, with the same premium comfort standards on the return leg.',
      currency: 'EUR',
      status: 'published',
      vehicle_tiers: [
        { min_people: 1, max_people: 4, vehicle_name: 'Vito', cost: 100 },
        { min_people: 5, max_people: 12, vehicle_name: 'Sprinter', cost: 145 },
      ],
      fixed_costs: [],
      optional_costs: [{ name: 'Child Seat', cost_per_person: 8, category: 'extra' }],
      seo_title: '',
      seo_description: '',
    },
  ];

  for (const r of sampleRoutes) {
    const rawSlug = slugify(r.title, { lower: true, strict: true });
    let slug = rawSlug;
    let i = 2;
    while (await transferRoutes.slugExists(slug)) {
      slug = `${rawSlug}-${i++}`;
    }
    await transferRoutes.create({ ...r, slug });
  }

  await pool.query('UPDATE settings SET sample_transfer_seeded = 1 WHERE id = 1');
  console.log(
    `[db] Seeded ${sampleRoutes.length} sample preview transfer route(s). Delete them from Admin > Transfers whenever you like — they will not be recreated.`
  );
}

async function init() {
  await pool.query('SELECT 1'); // fail fast with a clear error if DB_* is wrong
  await createSchema();
  await runColumnMigrations();
  await migrateFromJsonIfNeeded();
  await ensureAdminUser();
  await seedSampleContentIfNeeded();
  await seedSampleTransferIfNeeded();
}

module.exports = {
  init,
  adminUsers,
  tours,
  transferRoutes,
  availability,
  blogPosts,
  contactMessages,
  mediaFolders,
  mediaItems,
  redirects,
  adminLogs,
  visitLogs,
  siteFiles,
  settings,
  pageContent,
  TOUR_TYPES,
  isReservedTourSlug,
  departureSlug,
};
