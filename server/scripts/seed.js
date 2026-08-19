/**
 * Fills the site with realistic-looking demo content so you can see the
 * whole layout in action: 6 Package Tours, 6 Daily Tours, 6 Activities and
 * 6 Blog posts, all published, with placeholder photos.
 *
 * Usage:
 *   SITE_URL=https://pamukkaleguidebook.com ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword \
 *     node server/scripts/seed.js
 *
 * Run this from your own machine (or wherever you have terminal access to
 * the deployed site) — your admin password never has to be shared with
 * anyone else, it's only used locally to log in over HTTPS.
 *
 * Safe to re-run: it always creates NEW entries (titles get a "(demo)"
 * suffix so they're easy to find and delete later from the admin panel).
 */

const SITE_URL = (process.env.SITE_URL || 'http://localhost:4000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running this.');
  process.exit(1);
}

function img(seed, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const packageTours = [
  {
    title: 'Cappadocia 3-Day Package Tour (demo)',
    summary: 'Fairy chimneys, underground cities and a sunrise hot air balloon view.',
    description:
      'Discover the surreal landscapes of Cappadocia over three unforgettable days: cave hotels, the Goreme Open Air Museum, an underground city, and a horseback ride through Love Valley.',
    price: 349, original_price: 429, currency: 'USD', duration_days: 3,
    location: 'Cappadocia', capacity: 12,
    highlights: ['Goreme Open Air Museum', 'Underground City', 'Love Valley', 'Uchisar Castle'],
    included: ['Professional guide', 'Hotel pickup & drop-off', 'Entrance fees', 'Lunch'],
    excluded: ['Hot air balloon ride', 'Personal expenses', 'Tips'],
    itinerary: [
      { day_number: 1, title: 'Arrival & Red Tour', details: 'Goreme Open Air Museum, Uchisar Castle, Pasabag.' },
      { day_number: 2, title: 'Green Tour', details: 'Derinkuyu Underground City, Ihlara Valley, Selime Monastery.' },
      { day_number: 3, title: 'Free Morning & Departure', details: 'Optional hot air balloon ride, transfer to airport.' },
    ],
    images: [{ url: img('cappadocia1') }, { url: img('cappadocia2') }],
  },
  {
    title: 'Ephesus & Pamukkale 2-Day Tour (demo)',
    summary: 'Ancient ruins and the cotton-white travertines, back to back.',
    description:
      'Combine two of Turkey\'s most famous sites: the ancient city of Ephesus and the dazzling white terraces of Pamukkale, with an overnight stay in a thermal hotel.',
    price: 189, original_price: 0, currency: 'USD', duration_days: 2,
    location: 'Izmir / Denizli', capacity: 16,
    highlights: ['Ephesus Ancient City', 'House of Virgin Mary', 'Pamukkale Travertines', 'Hierapolis'],
    included: ['Guide', 'Transport', 'Entrance fees', 'Thermal hotel'],
    excluded: ['Meals', 'Personal expenses'],
    itinerary: [
      { day_number: 1, title: 'Ephesus', details: 'Ancient city, Terrace Houses, House of Virgin Mary.' },
      { day_number: 2, title: 'Pamukkale', details: 'Travertines, Hierapolis ancient city, Cleopatra Pool (optional).' },
    ],
    images: [{ url: img('ephesus1') }, { url: img('pamukkale1') }],
  },
  {
    title: 'Istanbul Classics 4-Day Tour (demo)',
    summary: 'Hagia Sophia, Topkapi Palace, the Grand Bazaar and a Bosphorus cruise.',
    description:
      'A relaxed four-day introduction to Istanbul\'s must-see landmarks on both the European and Asian sides of the city.',
    price: 429, original_price: 499, currency: 'USD', duration_days: 4,
    location: 'Istanbul', capacity: 14,
    highlights: ['Hagia Sophia', 'Topkapi Palace', 'Grand Bazaar', 'Bosphorus Cruise'],
    included: ['Guide', 'Hotel', 'Breakfast', 'Entrance fees'],
    excluded: ['Flights', 'Lunch & dinner'],
    itinerary: [
      { day_number: 1, title: 'Old City', details: 'Hagia Sophia, Blue Mosque, Hippodrome.' },
      { day_number: 2, title: 'Topkapi & Bazaars', details: 'Topkapi Palace, Grand Bazaar, Spice Bazaar.' },
      { day_number: 3, title: 'Bosphorus', details: 'Bosphorus cruise, Dolmabahce Palace.' },
      { day_number: 4, title: 'Free Day & Departure', details: 'Free time for shopping, transfer to airport.' },
    ],
    images: [{ url: img('istanbul1') }, { url: img('istanbul2') }],
  },
  {
    title: 'Turkish Riviera 5-Day Tour (demo)',
    summary: 'Antalya, Kas and the turquoise coast at a relaxed pace.',
    description:
      'Sun, sea and ancient ruins along the Turkish Riviera — from Antalya\'s old town to the turquoise bays of Kas.',
    price: 549, original_price: 0, currency: 'USD', duration_days: 5,
    location: 'Antalya', capacity: 10,
    highlights: ['Antalya Old Town', 'Duden Waterfalls', 'Kas', 'Boat trip'],
    included: ['Guide', 'Hotel', 'Breakfast', 'Boat trip'],
    excluded: ['Flights', 'Lunch & dinner'],
    itinerary: [
      { day_number: 1, title: 'Arrival', details: 'Transfer and Antalya Old Town walk.' },
      { day_number: 2, title: 'Waterfalls & Coast', details: 'Duden Waterfalls, coastal drive.' },
      { day_number: 3, title: 'Kas', details: 'Transfer to Kas, boat trip along the coast.' },
      { day_number: 4, title: 'Free Day', details: 'Free time to relax or explore.' },
      { day_number: 5, title: 'Departure', details: 'Transfer to airport.' },
    ],
    images: [{ url: img('antalya1') }, { url: img('kas1') }],
  },
  {
    title: 'Black Sea Highlands 3-Day Tour (demo)',
    summary: 'Green plateaus, mountain villages and the misty Kackar range.',
    description:
      'Escape to Turkey\'s lush, green Black Sea highlands — a different side of the country, full of plateaus, tea gardens and traditional villages.',
    price: 299, original_price: 0, currency: 'USD', duration_days: 3,
    location: 'Rize / Trabzon', capacity: 12,
    highlights: ['Ayder Plateau', 'Sumela Monastery', 'Uzungol Lake'],
    included: ['Guide', 'Transport', 'Hotel', 'Breakfast'],
    excluded: ['Lunch & dinner', 'Personal expenses'],
    itinerary: [
      { day_number: 1, title: 'Trabzon & Sumela', details: 'Sumela Monastery, Trabzon city tour.' },
      { day_number: 2, title: 'Uzungol', details: 'Uzungol Lake and surrounding villages.' },
      { day_number: 3, title: 'Ayder Plateau', details: 'Ayder Plateau, hot springs, departure.' },
    ],
    images: [{ url: img('blacksea1') }, { url: img('blacksea2') }],
  },
  {
    title: 'Eastern Turkey Explorer 6-Day Tour (demo)',
    summary: 'Mount Nemrut, Lake Van and the ancient city of Ani.',
    description:
      'An in-depth journey through Eastern Turkey\'s dramatic landscapes and lesser-visited historical sites, for travelers who want to go further off the beaten path.',
    price: 699, original_price: 799, currency: 'USD', duration_days: 6,
    location: 'Eastern Turkey', capacity: 10,
    highlights: ['Mount Nemrut', 'Lake Van', 'Akdamar Island', 'Ani Ruins'],
    included: ['Guide', 'Transport', 'Hotel', 'Breakfast'],
    excluded: ['Flights', 'Lunch & dinner'],
    itinerary: [
      { day_number: 1, title: 'Arrival', details: 'Transfer and orientation.' },
      { day_number: 2, title: 'Mount Nemrut', details: 'Sunrise at the summit statues.' },
      { day_number: 3, title: 'Lake Van', details: 'Akdamar Island, lakeside towns.' },
      { day_number: 4, title: 'Ani Ruins', details: 'The ancient city of Ani near Kars.' },
      { day_number: 5, title: 'Local Culture', details: 'Local markets and villages.' },
      { day_number: 6, title: 'Departure', details: 'Transfer to airport.' },
    ],
    images: [{ url: img('nemrut1') }, { url: img('van1') }],
  },
];

const dailyTours = [
  {
    title: 'Pamukkale & Hierapolis Daily Tour (demo)',
    summary: 'A full day at the travertines and the ancient spa city above them.',
    description: 'Spend a full day exploring the white travertine terraces of Pamukkale and the ruins of ancient Hierapolis, with a local guide.',
    price: 59, original_price: 0, currency: 'USD', duration_days: 1, location: 'Denizli',
    highlights: ['Travertines', 'Hierapolis', 'Antique Pool (optional)'],
    included: ['Guide', 'Transport', 'Entrance fees'], excluded: ['Lunch', 'Antique Pool ticket'],
    images: [{ url: img('pamukkale-daily1') }],
  },
  {
    title: 'Ephesus Daily Tour from Kusadasi (demo)',
    summary: 'The best-preserved ancient city on the Aegean coast, in a day.',
    description: 'A guided day trip to Ephesus from Kusadasi, covering the Terrace Houses, Library of Celsus and the Great Theatre.',
    price: 49, original_price: 0, currency: 'USD', duration_days: 1, location: 'Kusadasi',
    highlights: ['Library of Celsus', 'Great Theatre', 'Terrace Houses'],
    included: ['Guide', 'Transport', 'Entrance fees'], excluded: ['Lunch'],
    images: [{ url: img('ephesus-daily1') }],
  },
  {
    title: 'Istanbul Old City Daily Tour (demo)',
    summary: 'Hagia Sophia, Blue Mosque and the Grand Bazaar in one day.',
    description: 'See the highlights of Istanbul\'s historic peninsula in a single well-paced day with a local guide.',
    price: 65, original_price: 0, currency: 'USD', duration_days: 1, location: 'Istanbul',
    highlights: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar'],
    included: ['Guide', 'Entrance fees'], excluded: ['Lunch', 'Transport'],
    images: [{ url: img('istanbul-daily1') }],
  },
  {
    title: 'Cappadocia Highlights Daily Tour (demo)',
    summary: 'Fairy chimneys and valleys without an overnight stay.',
    description: 'A single-day version of our Cappadocia tour — perfect if you\'re short on time but still want to see the highlights.',
    price: 55, original_price: 0, currency: 'USD', duration_days: 1, location: 'Cappadocia',
    highlights: ['Goreme Valley', 'Pasabag Fairy Chimneys', 'Uchisar Castle'],
    included: ['Guide', 'Transport', 'Lunch'], excluded: ['Hot air balloon ride'],
    images: [{ url: img('cappadocia-daily1') }],
  },
  {
    title: 'Aphrodisias & Pamukkale Daily Tour (demo)',
    summary: 'Two ancient sites, one easy day trip.',
    description: 'Visit the exceptionally preserved ruins of Aphrodisias before heading to the travertines of Pamukkale.',
    price: 69, original_price: 0, currency: 'USD', duration_days: 1, location: 'Denizli',
    highlights: ['Aphrodisias Stadium', 'Aphrodisias Museum', 'Pamukkale Travertines'],
    included: ['Guide', 'Transport', 'Entrance fees'], excluded: ['Lunch'],
    images: [{ url: img('aphrodisias1') }],
  },
  {
    title: 'Bodrum Bays Daily Tour (demo)',
    summary: 'A boat trip around Bodrum\'s best swimming spots.',
    description: 'A relaxed day sailing around Bodrum\'s turquoise bays, with stops for swimming and a light lunch on board.',
    price: 45, original_price: 0, currency: 'USD', duration_days: 1, location: 'Bodrum',
    highlights: ['Boat trip', 'Swimming stops', 'Scenic bays'],
    included: ['Boat', 'Lunch on board'], excluded: ['Hotel transfer'],
    images: [{ url: img('bodrum1') }],
  },
];

const activities = [
  {
    title: 'Pamukkale Hot Air Balloon Ride (demo)',
    summary: 'Float above the white travertines at sunrise.',
    description: 'A sunrise hot air balloon flight over the travertines of Pamukkale — a bucket-list experience with sweeping views.',
    price: 150, original_price: 0, currency: 'USD', duration_days: 1, location: 'Pamukkale',
    highlights: ['Sunrise flight', 'Champagne toast', 'Certificate'],
    included: ['Pilot', 'Hotel pickup', 'Light refreshments'], excluded: ['Photos/video package'],
    images: [{ url: img('balloon-pamukkale') }],
  },
  {
    title: 'Cappadocia Hot Air Balloon Flight (demo)',
    summary: 'The classic Cappadocia balloon experience over the fairy chimneys.',
    description: 'One of the most iconic experiences in Turkey — drift over Cappadocia\'s fairy chimneys and valleys at dawn.',
    price: 180, original_price: 220, currency: 'USD', duration_days: 1, location: 'Cappadocia',
    highlights: ['1-hour flight', 'Small groups', 'Certificate & champagne'],
    included: ['Pilot', 'Hotel pickup', 'Insurance'], excluded: ['Tips'],
    images: [{ url: img('balloon-cappadocia') }],
  },
  {
    title: 'Traditional Turkish Cooking Class (demo)',
    summary: 'Learn to cook Turkish classics with a local chef.',
    description: 'Hands-on cooking class covering Turkish mezes, a main course and baklava, followed by a shared meal.',
    price: 40, original_price: 0, currency: 'USD', duration_days: 1, location: 'Izmir',
    highlights: ['Hands-on cooking', 'Recipe booklet', 'Shared meal'],
    included: ['Ingredients', 'Chef instruction', 'Meal'], excluded: ['Transport'],
    images: [{ url: img('cooking1') }],
  },
  {
    title: 'Thermal Pools & Spa Experience (demo)',
    summary: 'A relaxing half day at a natural thermal spa.',
    description: 'Unwind in natural thermal pools with an optional massage and spa treatments.',
    price: 35, original_price: 0, currency: 'USD', duration_days: 1, location: 'Pamukkale',
    highlights: ['Thermal pools', 'Optional massage', 'Changing facilities'],
    included: ['Entrance fee', 'Towel'], excluded: ['Massage (optional add-on)'],
    images: [{ url: img('spa1') }],
  },
  {
    title: 'Paragliding in Oludeniz (demo)',
    summary: 'Tandem paraglide over the Blue Lagoon.',
    description: 'Tandem paragliding flight from Babadag mountain, landing on the beach at Oludeniz\'s famous Blue Lagoon.',
    price: 90, original_price: 0, currency: 'USD', duration_days: 1, location: 'Fethiye',
    highlights: ['Tandem flight', 'Certified pilot', 'Video package (optional)'],
    included: ['Equipment', 'Pilot', 'Hotel pickup'], excluded: ['Video package'],
    images: [{ url: img('paragliding1') }],
  },
  {
    title: 'Turkish Night Show with Dinner (demo)',
    summary: 'Folk dance, belly dance and a set dinner menu.',
    description: 'An evening of traditional Turkish folk dance and belly dance performances with a multi-course dinner and drinks.',
    price: 55, original_price: 0, currency: 'USD', duration_days: 1, location: 'Antalya',
    highlights: ['Live performances', 'Set dinner menu', 'Drinks included'],
    included: ['Dinner', 'Show', 'Hotel transfer'], excluded: ['Premium drinks'],
    images: [{ url: img('turkishnight1') }],
  },
];

const blogPosts = [
  {
    title: 'Best Time to Visit Pamukkale (demo)',
    excerpt: 'Weather, crowds and the best months to see the travertines.',
    content: 'Spring (April–May) and autumn (September–October) offer the best combination of mild weather and smaller crowds at Pamukkale. Summer is hot but the pools stay pleasant; winter is quiet and surprisingly scenic with occasional light snow on the white terraces.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-pamukkale-time'),
  },
  {
    title: 'Top 5 Things to Do in Cappadocia (demo)',
    excerpt: 'From hot air balloons to underground cities.',
    content: '1. Take a sunrise hot air balloon flight. 2. Explore the Goreme Open Air Museum. 3. Descend into an underground city like Derinkuyu. 4. Hike through Love Valley or Rose Valley. 5. Stay a night in a traditional cave hotel.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-cappadocia-top5'),
  },
  {
    title: 'A Complete Guide to Ephesus Ruins (demo)',
    excerpt: 'What to see and how to plan your visit.',
    content: 'Ephesus is one of the best-preserved ancient cities in the Mediterranean. Highlights include the Library of Celsus, the Great Theatre, and the Terrace Houses (a small additional ticket, well worth it). Plan for at least 2-3 hours, and go early to beat both the heat and the cruise-ship crowds.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-ephesus-guide'),
  },
  {
    title: 'What to Pack for Your Turkey Trip (demo)',
    excerpt: 'A practical packing list for every season.',
    content: 'Comfortable walking shoes are essential for ancient sites with uneven ground. Bring modest clothing for mosque visits (shoulders and knees covered, a scarf for women). Sun protection is a must in summer, while a light jacket covers cooler evenings in spring and autumn.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-packing'),
  },
  {
    title: 'Turkish Cuisine: Must-Try Dishes (demo)',
    excerpt: 'From kebabs to baklava, what to order.',
    content: 'Don\'t leave Turkey without trying: manti (Turkish dumplings), testi kebab (pottery kebab), pide (Turkish flatbread), and of course baklava with a cup of Turkish tea. Regional specialties vary widely, so ask locals for their favorites wherever you travel.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-cuisine'),
  },
  {
    title: 'Hidden Gems of the Turkish Coast (demo)',
    excerpt: 'Beyond the well-known resort towns.',
    content: 'Beyond Bodrum and Antalya, towns like Kas, Kalkan and Akyaka offer a quieter, more local coastal experience — smaller crowds, family-run restaurants, and equally stunning turquoise water.',
    author: 'Pamukkale GuideBook Team',
    cover_image: img('blog-hiddengems'),
  },
];

async function api(path, options = {}) {
  const res = await fetch(`${SITE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  return res.json();
}

async function main() {
  console.log(`Logging in to ${SITE_URL} ...`);
  const { token } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const authHeaders = { Authorization: `Bearer ${token}` };

  async function createAll(label, endpoint, items) {
    console.log(`\nCreating ${items.length} ${label}...`);
    for (const item of items) {
      await api(endpoint, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...item, status: 'published' }),
      });
      console.log(`  ✓ ${item.title}`);
    }
  }

  await createAll('package tours', '/api/admin/package-tours', packageTours);
  await createAll('daily tours', '/api/admin/daily-tours', dailyTours);
  await createAll('activities', '/api/admin/activities', activities);
  await createAll('blog posts', '/api/admin/blog', blogPosts);

  console.log('\nDone! All demo content is published and live.');
  console.log('Titles end with "(demo)" so you can find and delete them later from the admin panel.');
}

main().catch((err) => {
  console.error('\nSeed script failed:', err.message);
  process.exit(1);
});
