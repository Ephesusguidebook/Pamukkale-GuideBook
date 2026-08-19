const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Basit, bağımlılıksız JSON dosya tabanlı veri katmanı.
// better-sqlite3 gibi native (derleme gerektiren) paketlere ihtiyaç duymaz,
// bu yüzden kısıtlı build ortamlarında (ör. paylaşımlı hosting) sorunsuz çalışır.

const DATA_FILE = path.join(__dirname, 'data.json');

function emptyState() {
  return {
    adminUsers: [],
    tours: [],
    contactMessages: [],
    counters: { adminUsers: 0, tours: 0, contactMessages: 0, images: 0, itinerary: 0 },
  };
}

function load() {
  if (!fs.existsSync(DATA_FILE)) return emptyState();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function nextId(key) {
  state.counters[key] = (state.counters[key] || 0) + 1;
  return state.counters[key];
}

function nowIso() {
  return new Date().toISOString();
}

// --- Admin kullanıcıları ---
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
    console.log(`[db] Admin kullanıcısı oluşturuldu: ${email.toLowerCase().trim()}`);
  }
}
ensureAdminUser();

// --- Turlar ---
function normalizeTourInput(input) {
  return {
    title: input.title,
    summary: input.summary || '',
    description: input.description || '',
    price: Number(input.price) || 0,
    currency: input.currency || 'TRY',
    duration_days: Number(input.duration_days) || 1,
    location: input.location || '',
    start_date: input.start_date || '',
    capacity: Number(input.capacity) || 0,
    status: input.status === 'draft' ? 'draft' : 'published',
    cover_image: input.cover_image || '',
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

const tours = {
  listPublished() {
    return state.tours
      .filter((t) => t.status === 'published')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  listAll() {
    return [...state.tours].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getById(id) {
    return state.tours.find((t) => t.id === Number(id)) || null;
  },
  getPublishedBySlug(slug) {
    return state.tours.find((t) => t.slug === slug && t.status === 'published') || null;
  },
  slugExists(slug, ignoreId) {
    return state.tours.some((t) => t.slug === slug && t.id !== ignoreId);
  },
  create(input) {
    const tour = {
      id: nextId('tours'),
      slug: input.slug,
      ...normalizeTourInput(input),
      images: normalizeImages(input.images),
      itinerary: normalizeItinerary(input.itinerary),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.tours.push(tour);
    persist();
    return tour;
  },
  update(id, input) {
    const idx = state.tours.findIndex((t) => t.id === Number(id));
    if (idx === -1) return null;
    const existing = state.tours[idx];
    const updated = {
      ...existing,
      slug: input.slug || existing.slug,
      ...normalizeTourInput(input),
      images: normalizeImages(input.images),
      itinerary: normalizeItinerary(input.itinerary),
      updated_at: nowIso(),
    };
    state.tours[idx] = updated;
    persist();
    return updated;
  },
  remove(id) {
    const idx = state.tours.findIndex((t) => t.id === Number(id));
    if (idx === -1) return false;
    state.tours.splice(idx, 1);
    persist();
    return true;
  },
};

// --- İletişim mesajları ---
const contactMessages = {
  create(input) {
    const msg = {
      id: nextId('contactMessages'),
      tour_id: input.tour_id ? Number(input.tour_id) : null,
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
  listWithTourTitle() {
    return [...state.contactMessages]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((m) => {
        const tour = m.tour_id ? tours.getById(m.tour_id) : null;
        return { ...m, tour_title: tour ? tour.title : null };
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

module.exports = { adminUsers, tours, contactMessages };
