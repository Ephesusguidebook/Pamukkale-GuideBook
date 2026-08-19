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
    settings: {
      consultant_name: '',
      consultant_title: '',
      consultant_phone: '',
      consultant_whatsapp: '',
      consultant_email: '',
      consultant_photo: '',
    },
    pageContent: {},
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
    return msg;
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
  },
  packageTours: {
    h1: 'Package Tours',
    p: 'Multi-day, all-inclusive tour packages covering the best destinations in Turkey.',
  },
  dailyTours: {
    h1: 'Daily Tours',
    p: 'Single-day guided tours — see the highlights without an overnight stay.',
  },
  activities: {
    h1: 'Activities',
    p: 'Standalone experiences and activities you can add to your trip.',
  },
  blog: {
    h1: 'Blog',
    p: 'Travel tips, destination guides and stories from around Turkey.',
  },
  aboutUs: {
    h1: 'About Us',
    p: 'We are a Turkey-based travel company dedicated to helping you discover the country’s most remarkable destinations.',
  },
  contact: {
    h1: 'Contact',
    p: "Questions or special requests? Send us a message and we'll get back to you as soon as possible.",
  },
  terms: {
    h1: 'Terms and Conditions',
    p: 'Please read these terms carefully before booking a tour or activity with us.',
  },
  privacy: {
    h1: 'Privacy Policy',
    p: 'How we collect, use and protect the information you share with us.',
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
    const next = {};
    for (const key of Object.keys(PAGE_CONTENT_DEFAULTS)) {
      const b = (input && input[key]) || {};
      next[key] = {
        h1: b.h1 !== undefined ? String(b.h1) : pageContent.get()[key].h1,
        p: b.p !== undefined ? String(b.p) : pageContent.get()[key].p,
      };
    }
    state.pageContent = next;
    persist();
    return pageContent.get();
  },
};

module.exports = {
  adminUsers,
  packageTours,
  dailyTours,
  activities,
  blogPosts,
  contactMessages,
  settings,
  pageContent,
};
