const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Simple, dependency-free JSON file based data layer.
// Avoids native (compiled) packages like better-sqlite3, so it runs fine on
// restricted build environments (e.g. shared hosting).

const DATA_FILE = path.join(__dirname, 'data.json');

function emptyState() {
  return {
    adminUsers: [],
    packageTours: [],
    dailyTours: [],
    activities: [],
    blogPosts: [],
    contactMessages: [],
    mediaFolders: [],
    mediaItems: [],
    redirects: [],
    adminLogs: [],
    visitLogs: [],
    settings: {
      consultant_name: '',
      consultant_title: '',
      consultant_phone: '',
      consultant_whatsapp: '',
      consultant_email: '',
      consultant_photo: '',
      whatsapp_button_phone: '',
      notification_email: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      facebook_url: '',
      instagram_url: '',
      site_logo: '',
      site_favicon: '',
      google_site_verification: '',
      ga4_measurement_id: '',
      google_ads_id: '',
    },
    pageContent: {},
    siteFiles: {},
    counters: {
      adminUsers: 0,
      packageTours: 0,
      dailyTours: 0,
      activities: 0,
      blogPosts: 0,
      contactMessages: 0,
      images: 0,
      itinerary: 0,
      routePoints: 0,
      mediaFolders: 0,
      mediaItems: 0,
      redirects: 0,
      adminLogs: 0,
      visitLogs: 0,
    },
  };
}

function load() {
  const base = emptyState();
  if (!fs.existsSync(DATA_FILE)) return base;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const merged = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      counters: { ...base.counters, ...(parsed.counters || {}) },
    };

    // One-time migration from the old single "tours" collection (pre
    // package-tours / daily-tours / activities split) into packageTours,
    // so nothing that was already published gets silently lost.
    if (Array.isArray(parsed.tours) && parsed.tours.length && merged.packageTours.length === 0) {
      merged.packageTours = parsed.tours;
      merged.counters.packageTours = parsed.counters?.tours || merged.counters.packageTours;
      delete merged.tours;
      console.log(
        `[db] Migrated ${parsed.tours.length} legacy tour(s) into Package Tours. ` +
          `Re-categorize them into Daily Tours / Activities from the admin panel if needed.`
      );
    }
    delete merged.tours;

    return merged;
  } catch {
    return base;
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}
// Run once at startup so a migrated legacy file is saved back in the new shape.
persist();

function nextId(key) {
  state.counters[key] = (state.counters[key] || 0) + 1;
  return state.counters[key];
}

function nowIso() {
  return new Date().toISOString();
}

// --- Admin users ---
const adminUsers = {
  findByEmail(email) {
    const e = String(email || '').toLowerCase().trim();
    return state.adminUsers.find((u) => u.email === e) || null;
  },
  create(email, passwordHash) {
    const user = {
      id: nextId('adminUsers'),
      email: String(email).toLowerCase().trim(),
      password_hash: passwordHash,
      created_at: nowIso(),
    };
    state.adminUsers.push(user);
    persist();
    return user;
  },
};

function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  if (!adminUsers.findByEmail(email)) {
    const hash = bcrypt.hashSync(password, 10);
    adminUsers.create(email, hash);
    console.log(`[db] Admin user created: ${email.toLowerCase().trim()}`);
  }
}
ensureAdminUser();

// --- Shared helpers for tour-like entries (package tours, daily tours, activities) ---

// Accepts both an array and line-separated text ("A\nB\nC" -> ["A","B","C"]).
function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeEntryInput(input) {
  const originalPrice = Number(input.original_price) || 0;
  return {
    title: input.title,
    summary: input.summary || '',
    description: input.description || '',
    price: Number(input.price) || 0,
    original_price: originalPrice,
    price_note: input.price_note || '',
    currency: input.currency || 'USD',
    duration_days: Number(input.duration_days) || 1,
    location: input.location || '',
    start_date: input.start_date || '',
    capacity: Number(input.capacity) || 0,
    status: input.status === 'draft' ? 'draft' : 'published',
    cover_image: input.cover_image || '',
    languages: normalizeStringList(input.languages),
    highlights: normalizeStringList(input.highlights),
    included: normalizeStringList(input.included),
    excluded: normalizeStringList(input.excluded),
    seo_title: input.seo_title || '',
    seo_description: input.seo_description || '',
  };
}

function normalizeImages(images) {
  return (images || [])
    .map((img, idx) => ({
      id: nextId('images'),
      url: typeof img === 'string' ? img : img.url,
      sort_order: idx,
    }))
    .filter((img) => !!img.url);
}

function normalizeItinerary(itinerary) {
  return (itinerary || []).map((day, idx) => ({
    id: nextId('itinerary'),
    day_number: Number(day.day_number) || idx + 1,
    title: day.title || '',
    details: day.details || '',
    sort_order: idx,
  }));
}

function normalizeRoute(route) {
  return (route || [])
    .map((point, idx) => ({
      id: nextId('routePoints'),
      name: point.name || '',
      lat: Number(point.lat),
      lng: Number(point.lng),
      sort_order: idx,
    }))
    .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

// Factory shared by Package Tours, Daily Tours and Activities: each is kept
// as its own independent collection (own admin screens, own API routes),
// but they share the same entry shape and CRUD behaviour.
function createEntryCollection(stateKey) {
  return {
    listPublished() {
      return state[stateKey]
        .filter((t) => t.status === 'published')
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
    listAll() {
      return [...state[stateKey]].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
    getById(id) {
      return state[stateKey].find((t) => t.id === Number(id)) || null;
    },
    getPublishedBySlug(slug) {
      return state[stateKey].find((t) => t.slug === slug && t.status === 'published') || null;
    },
    slugExists(slug, ignoreId) {
      return state[stateKey].some((t) => t.slug === slug && t.id !== ignoreId);
    },
    create(input) {
      const item = {
        id: nextId(stateKey),
        slug: input.slug,
        ...normalizeEntryInput(input),
        images: normalizeImages(input.images),
        itinerary: normalizeItinerary(input.itinerary),
        route: normalizeRoute(input.route),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      state[stateKey].push(item);
      persist();
      return item;
    },
    update(id, input) {
      const idx = state[stateKey].findIndex((t) => t.id === Number(id));
      if (idx === -1) return null;
      const existing = state[stateKey][idx];
      const updated = {
        ...existing,
        slug: input.slug || existing.slug,
        ...normalizeEntryInput(input),
        images: normalizeImages(input.images),
        itinerary: normalizeItinerary(input.itinerary),
        route: normalizeRoute(input.route),
        updated_at: nowIso(),
      };
      state[stateKey][idx] = updated;
      persist();
      return updated;
    },
    remove(id) {
      const idx = state[stateKey].findIndex((t) => t.id === Number(id));
      if (idx === -1) return false;
      state[stateKey].splice(idx, 1);
      persist();
      return true;
    },
  };
}

const packageTours = createEntryCollection('packageTours');
const dailyTours = createEntryCollection('dailyTours');
const activities = createEntryCollection('activities');

// --- Blog ---
function normalizeBlogInput(input) {
  return {
    title: input.title,
    excerpt: input.excerpt || '',
    content: input.content || '',
    cover_image: input.cover_image || '',
    author: input.author || '',
    status: input.status === 'draft' ? 'draft' : 'published',
    seo_title: input.seo_title || '',
    seo_description: input.seo_description || '',
  };
}

const blogPosts = {
  listPublished() {
    return state.blogPosts
      .filter((p) => p.status === 'published')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  listAll() {
    return [...state.blogPosts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getById(id) {
    return state.blogPosts.find((p) => p.id === Number(id)) || null;
  },
  getPublishedBySlug(slug) {
    return state.blogPosts.find((p) => p.slug === slug && p.status === 'published') || null;
  },
  slugExists(slug, ignoreId) {
    return state.blogPosts.some((p) => p.slug === slug && p.id !== ignoreId);
  },
  create(input) {
    const post = {
      id: nextId('blogPosts'),
      slug: input.slug,
      ...normalizeBlogInput(input),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.blogPosts.push(post);
    persist();
    return post;
  },
  update(id, input) {
    const idx = state.blogPosts.findIndex((p) => p.id === Number(id));
    if (idx === -1) return null;
    const existing = state.blogPosts[idx];
    const updated = {
      ...existing,
      slug: input.slug || existing.slug,
      ...normalizeBlogInput(input),
      updated_at: nowIso(),
    };
    state.blogPosts[idx] = updated;
    persist();
    return updated;
  },
  remove(id) {
    const idx = state.blogPosts.findIndex((p) => p.id === Number(id));
    if (idx === -1) return false;
    state.blogPosts.splice(idx, 1);
    persist();
    return true;
  },
};

// --- Contact messages ---
// item_type is one of: 'package_tour' | 'daily_tour' | 'activity' | null
const ITEM_COLLECTIONS = {
  package_tour: () => packageTours,
  daily_tour: () => dailyTours,
  activity: () => activities,
};

const contactMessages = {
  create(input) {
    const msg = {
      id: nextId('contactMessages'),
      item_type: ITEM_COLLECTIONS[input.item_type] ? input.item_type : null,
      item_id: input.item_id ? Number(input.item_id) : null,
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      message: input.message || '',
      status: 'new',
      created_at: nowIso(),
    };
    state.contactMessages.push(msg);
    persist();
    let item_title = null;
    if (msg.item_id && msg.item_type && ITEM_COLLECTIONS[msg.item_type]) {
      const item = ITEM_COLLECTIONS[msg.item_type]().getById(msg.item_id);
      item_title = item ? item.title : null;
    }
    return { ...msg, item_title };
  },
  listWithItemTitle() {
    return [...state.contactMessages]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((m) => {
        let item_title = null;
        if (m.item_id && m.item_type && ITEM_COLLECTIONS[m.item_type]) {
          const item = ITEM_COLLECTIONS[m.item_type]().getById(m.item_id);
          item_title = item ? item.title : null;
        }
        return { ...m, item_title };
      });
  },
  markRead(id) {
    const msg = state.contactMessages.find((m) => m.id === Number(id));
    if (!msg) return false;
    msg.status = 'read';
    persist();
    return true;
  },
};

// --- Media Library (folders + items) ---
// Every uploaded photo lives here first; galleries/sliders on tours,
// activities and blog posts reference items from this shared library
// instead of uploading ad hoc per form.
const mediaFolders = {
  listAll() {
    return [...state.mediaFolders].sort((a, b) => a.name.localeCompare(b.name));
  },
  getById(id) {
    return state.mediaFolders.find((f) => f.id === Number(id)) || null;
  },
  create(input) {
    const folder = {
      id: nextId('mediaFolders'),
      name: String(input.name).trim(),
      parent_id: input.parent_id ? Number(input.parent_id) : null,
      created_at: nowIso(),
    };
    state.mediaFolders.push(folder);
    persist();
    return folder;
  },
  remove(id) {
    const numId = Number(id);
    const hasSubfolders = state.mediaFolders.some((f) => f.parent_id === numId);
    const hasItems = state.mediaItems.some((i) => i.folder_id === numId);
    if (hasSubfolders || hasItems) return false;
    const idx = state.mediaFolders.findIndex((f) => f.id === numId);
    if (idx === -1) return false;
    state.mediaFolders.splice(idx, 1);
    persist();
    return true;
  },
};

const mediaItems = {
  listByFolder(folderId) {
    const target = folderId || null;
    return [...state.mediaItems]
      .filter((i) => (i.folder_id || null) === target)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  listAll() {
    return [...state.mediaItems].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getById(id) {
    return state.mediaItems.find((i) => i.id === Number(id)) || null;
  },
  create(input) {
    const item = {
      id: nextId('mediaItems'),
      url: input.url,
      filename: input.filename,
      original_name: input.original_name || '',
      folder_id: input.folder_id ? Number(input.folder_id) : null,
      size: input.size || 0,
      width: input.width || null,
      height: input.height || null,
      created_at: nowIso(),
    };
    state.mediaItems.push(item);
    persist();
    return item;
  },
  remove(id) {
    const idx = state.mediaItems.findIndex((i) => i.id === Number(id));
    if (idx === -1) return false;
    state.mediaItems.splice(idx, 1);
    persist();
    return true;
  },
};

// Admins usually paste whatever Google's own setup page gives them, which is
// sometimes the bare code and sometimes the full <meta>/<script> snippet —
// these pull just the meaningful value out of either so a paste always works.
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

// --- Site settings (Travel Consultant card, etc.) ---
const settings = {
  get() {
    return state.settings;
  },
  update(input) {
    state.settings = {
      consultant_name: input.consultant_name || '',
      consultant_title: input.consultant_title || '',
      consultant_phone: input.consultant_phone || '',
      consultant_whatsapp: input.consultant_whatsapp || '',
      consultant_email: input.consultant_email || '',
      consultant_photo: input.consultant_photo || '',
      whatsapp_button_phone: input.whatsapp_button_phone || '',
      notification_email: input.notification_email || '',
      contact_email: input.contact_email || '',
      contact_phone: input.contact_phone || '',
      contact_address: input.contact_address || '',
      facebook_url: input.facebook_url || '',
      instagram_url: input.instagram_url || '',
      site_logo: input.site_logo || '',
      site_favicon: input.site_favicon || '',
      google_site_verification: extractSiteVerificationCode(input.google_site_verification),
      ga4_measurement_id: extractPrefixedId(input.ga4_measurement_id, 'G'),
      google_ads_id: extractPrefixedId(input.google_ads_id, 'AW'),
    };
    persist();
    return state.settings;
  },
};

// --- Editable page content (H1 + intro paragraph per page) ---
// Lets the admin tweak headline copy without a code change. Falls back to
// these defaults wherever the admin hasn't overridden a page yet.
const PAGE_CONTENT_DEFAULTS = {
  home: {
    h1: 'Find your dream tour and hit the road',
    p: 'Explore our carefully curated package tours, daily tours and activities. Detailed itineraries, transparent pricing and easy communication.',
    seo_title: '',
    seo_description: '',
  },
  packageTours: {
    h1: 'Package Tours',
    p: 'Multi-day, all-inclusive tour packages covering the best destinations in Turkey.',
    seo_title: '',
    seo_description: '',
  },
  dailyTours: {
    h1: 'Daily Tours',
    p: 'Single-day guided tours — see the highlights without an overnight stay.',
    seo_title: '',
    seo_description: '',
  },
  activities: {
    h1: 'Activities',
    p: 'Standalone experiences and activities you can add to your trip.',
    seo_title: '',
    seo_description: '',
  },
  blog: {
    h1: 'Blog',
    p: 'Travel tips, destination guides and stories from around Turkey.',
    seo_title: '',
    seo_description: '',
  },
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
  get() {
    const stored = state.pageContent || {};
    const merged = {};
    for (const key of Object.keys(PAGE_CONTENT_DEFAULTS)) {
      merged[key] = { ...PAGE_CONTENT_DEFAULTS[key], ...(stored[key] || {}) };
    }
    return merged;
  },
  update(input) {
    const current = pageContent.get();
    const next = {};
    for (const key of Object.keys(PAGE_CONTENT_DEFAULTS)) {
      const b = (input && input[key]) || {};
      next[key] = {
        h1: b.h1 !== undefined ? String(b.h1) : current[key].h1,
        p: b.p !== undefined ? String(b.p) : current[key].p,
        seo_title: b.seo_title !== undefined ? String(b.seo_title) : current[key].seo_title,
        seo_description:
          b.seo_description !== undefined ? String(b.seo_description) : current[key].seo_description,
      };
    }
    state.pageContent = next;
    persist();
    return pageContent.get();
  },
};

// --- Redirects ---
// Lets the admin point an old/removed URL path at a new one (301 by
// default) whenever a page is deleted or its title/slug changes.
function normalizePath(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  // Allow pasting a full URL — keep only the path.
  try {
    if (/^https?:\/\//i.test(s)) {
      s = new URL(s).pathname;
    }
  } catch {
    // ignore, fall through and treat as a plain path
  }
  if (!s.startsWith('/')) s = `/${s}`;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

const redirects = {
  listAll() {
    return [...state.redirects].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getById(id) {
    return state.redirects.find((r) => r.id === Number(id)) || null;
  },
  findByPath(pathname) {
    const target = normalizePath(pathname);
    return state.redirects.find((r) => r.from_path === target) || null;
  },
  create(input) {
    const from_path = normalizePath(input.from_path);
    const to_path = normalizePath(input.to_path);
    if (!from_path || !to_path) throw new Error('Both paths are required.');
    if (from_path === to_path) throw new Error('The two paths must be different.');
    if (state.redirects.some((r) => r.from_path === from_path)) {
      throw new Error('A redirect from that path already exists.');
    }
    const redirect = {
      id: nextId('redirects'),
      from_path,
      to_path,
      status_code: Number(input.status_code) === 302 ? 302 : 301,
      created_at: nowIso(),
    };
    state.redirects.push(redirect);
    persist();
    return redirect;
  },
  update(id, input) {
    const idx = state.redirects.findIndex((r) => r.id === Number(id));
    if (idx === -1) return null;
    const from_path = normalizePath(input.from_path);
    const to_path = normalizePath(input.to_path);
    if (!from_path || !to_path) throw new Error('Both paths are required.');
    if (from_path === to_path) throw new Error('The two paths must be different.');
    if (state.redirects.some((r) => r.from_path === from_path && r.id !== Number(id))) {
      throw new Error('A redirect from that path already exists.');
    }
    const updated = {
      ...state.redirects[idx],
      from_path,
      to_path,
      status_code: Number(input.status_code) === 302 ? 302 : 301,
    };
    state.redirects[idx] = updated;
    persist();
    return updated;
  },
  remove(id) {
    const idx = state.redirects.findIndex((r) => r.id === Number(id));
    if (idx === -1) return false;
    state.redirects.splice(idx, 1);
    persist();
    return true;
  },
};

// --- Admin activity log ---
// Records who did what (login, create/update/delete, settings changes, ...)
// so there's an audit trail of admin actions on the site.
const MAX_ADMIN_LOGS = 3000;

const adminLogs = {
  create(input) {
    const entry = {
      id: nextId('adminLogs'),
      admin_email: input.admin_email || '',
      action: input.action || '', // 'login' | 'create' | 'update' | 'delete'
      entity_type: input.entity_type || '',
      entity_label: input.entity_label || '',
      created_at: nowIso(),
    };
    state.adminLogs.push(entry);
    if (state.adminLogs.length > MAX_ADMIN_LOGS) {
      state.adminLogs.splice(0, state.adminLogs.length - MAX_ADMIN_LOGS);
    }
    persist();
    return entry;
  },
  listRecent(limit) {
    const n = Math.min(Number(limit) || 100, 500);
    return [...state.adminLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, n);
  },
};

// --- Site traffic / crawler log ---
// Two kinds of entries share this table:
//  - "server": every real HTTP page request the server handles, tagged with
//    the final status code and whether the User-Agent matched a known bot
//    (Googlebot, GPTBot, ClaudeBot, ...). This is what surfaces crawl
//    errors (404s) and AI/search-bot activity.
//  - "client": a small ping the React app sends on every in-app route
//    change, tagged with a session id — this is what lets "pages per
//    session" be counted for real visitors (bots rarely run the JS).
const MAX_VISIT_LOGS = 8000;

const visitLogs = {
  create(input) {
    const entry = {
      id: nextId('visitLogs'),
      source: input.source === 'client' ? 'client' : 'server',
      path: input.path || '',
      status_code: input.status_code || null,
      is_bot: !!input.is_bot,
      bot_name: input.bot_name || null,
      user_agent: input.user_agent || '',
      referrer: input.referrer || '',
      session_id: input.session_id || '',
      created_at: nowIso(),
    };
    state.visitLogs.push(entry);
    if (state.visitLogs.length > MAX_VISIT_LOGS) {
      state.visitLogs.splice(0, state.visitLogs.length - MAX_VISIT_LOGS);
    }
    persist();
    return entry;
  },
  listRecent({ limit, onlyBots, onlyHuman, onlyErrors } = {}) {
    let rows = [...state.visitLogs];
    if (onlyBots) rows = rows.filter((r) => r.is_bot);
    if (onlyHuman) rows = rows.filter((r) => !r.is_bot);
    if (onlyErrors) rows = rows.filter((r) => (r.status_code || 0) >= 400);
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const n = Math.min(Number(limit) || 100, 500);
    return rows.slice(0, n);
  },
  summary() {
    const rows = state.visitLogs;
    const serverRows = rows.filter((r) => r.source === 'server');
    const clientRows = rows.filter((r) => r.source === 'client');
    const botRows = serverRows.filter((r) => r.is_bot);
    const humanServerRows = serverRows.filter((r) => !r.is_bot);
    const errorRows = serverRows.filter((r) => (r.status_code || 0) >= 400);

    const botCounts = {};
    botRows.forEach((r) => {
      const name = r.bot_name || 'Unknown Bot';
      botCounts[name] = (botCounts[name] || 0) + 1;
    });
    const topBots = Object.entries(botCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sessions come from the client-side pageview pings — bots typically
    // don't run the app's JS, so this stays focused on real visitors.
    const sessionMap = {};
    clientRows.forEach((r) => {
      if (!r.session_id) return;
      if (!sessionMap[r.session_id]) {
        sessionMap[r.session_id] = {
          session_id: r.session_id,
          pages: 0,
          first_seen: r.created_at,
          last_seen: r.created_at,
        };
      }
      const s = sessionMap[r.session_id];
      s.pages += 1;
      if (r.created_at < s.first_seen) s.first_seen = r.created_at;
      if (r.created_at > s.last_seen) s.last_seen = r.created_at;
    });
    const sessions = Object.values(sessionMap).sort((a, b) =>
      a.last_seen < b.last_seen ? 1 : -1
    );
    const avgPagesPerSession = sessions.length
      ? Math.round((sessions.reduce((sum, s) => sum + s.pages, 0) / sessions.length) * 10) / 10
      : 0;

    return {
      totalVisits: serverRows.length,
      botVisits: botRows.length,
      humanVisits: humanServerRows.length,
      errorCount: errorRows.length,
      topBots,
      sessionCount: sessions.length,
      avgPagesPerSession,
      recentSessions: sessions.slice(0, 50),
    };
  },
};

// --- Site files (llms.txt, robots.txt) ---
// Served dynamically at /llms.txt and /robots.txt so the admin can edit
// their raw text without a code change or redeploy.
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4000').replace(/\/$/, '');

const SITE_FILE_DEFAULTS = {
  llms_txt: `# Pamukkale GuideBook

> A Turkey-based travel company offering Package Tours (multi-day), Daily
> Tours (single-day), and standalone Activities, plus a travel blog.

## Site Structure

- /package-tours/ — multi-day, all-inclusive tour packages, listed with
  price, duration, itinerary and included/excluded items. Each tour has its
  own page at /package-tours/[slug]/.
- /daily-tours/ — single-day guided tours. Each tour has its own page at
  /daily-tours/[slug]/.
- /activities/ — standalone activities and experiences (e.g. hot air
  balloon rides, cooking classes). Each activity has its own page at
  /activities/[slug]/.
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
  get() {
    const stored = state.siteFiles || {};
    return {
      llms_txt: stored.llms_txt !== undefined ? stored.llms_txt : SITE_FILE_DEFAULTS.llms_txt,
      robots_txt:
        stored.robots_txt !== undefined ? stored.robots_txt : SITE_FILE_DEFAULTS.robots_txt,
    };
  },
  update(input) {
    const current = siteFiles.get();
    state.siteFiles = {
      llms_txt: input.llms_txt !== undefined ? String(input.llms_txt) : current.llms_txt,
      robots_txt:
        input.robots_txt !== undefined ? String(input.robots_txt) : current.robots_txt,
    };
    persist();
    return siteFiles.get();
  },
};

module.exports = {
  adminUsers,
  packageTours,
  dailyTours,
  activities,
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
};
