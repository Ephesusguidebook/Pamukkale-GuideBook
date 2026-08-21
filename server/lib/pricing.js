// Faz 2 — Cost & Pricing calculation.
//
// Confirmed formula (Turkish, as specified by the site owner):
//   Ödenecek Fiyat = (Sabit Maliyetler x (1 + Rol Bazlı Kar Oranı))
//                     + Seçilen İsteğe Bağlı Kalemler (ham maliyet, kar eklenmeden)
//
// Sabit Maliyetler (fixed costs) = the vehicle tier matching the party size
// (e.g. Vito for up to 5 people, Sprinter for 6+ — exactly one tier is
// "selected" per booking) + every flat fixed_costs line item (e.g. the
// guide). The role-based markup (settings.agency_markup_percent /
// settings.customer_markup_percent) applies ONLY to this fixed total —
// never to the optional items below.
//
// İsteğe Bağlı Kalemler (optional_costs — entrance fees, food, extras) are
// picked by the customer themselves at booking time and are always charged
// at raw per-person cost, with no markup at all.
//
// This file is the source of truth for the calculation and runs server-side
// (booking totals, cost previews from the admin API). client/src/lib/pricing.js
// mirrors the exact same logic for the instant live preview in the admin
// Cost & Pricing editor — keep the two in sync, the same way
// classifyToursSegment/classifySegment are kept in sync for /tours routing.

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// Picks the cheapest vehicle tier whose [min_people, max_people] range
// covers the party size. If the party is larger than every defined tier,
// falls back to the tier with the highest capacity (better to slightly
// under-charge for now than to refuse a price) — this only happens if the
// admin didn't define a tier wide enough, which the admin UI warns about.
function pickVehicleTier(tiers, partySize) {
  const list = Array.isArray(tiers) ? tiers : [];
  if (list.length === 0) return null;
  const n = Math.max(1, Number(partySize) || 1);
  const fitting = list.filter((t) => n >= (Number(t.min_people) || 1) && (t.max_people == null || n <= Number(t.max_people)));
  if (fitting.length > 0) {
    return fitting.slice().sort((a, b) => (a.max_people ?? Infinity) - (b.max_people ?? Infinity))[0];
  }
  return list.slice().sort((a, b) => (b.max_people ?? Infinity) - (a.max_people ?? Infinity))[0];
}

function markupPercentForRole(role, markupRates) {
  const rates = markupRates || {};
  if (role === 'agency') return Number(rates.agency_markup_percent) || 0;
  return Number(rates.customer_markup_percent) || 0;
}

// tour: { vehicle_tiers, fixed_costs, optional_costs }
// partySize: number of people booking
// selectedOptionalIds: ids of optional_costs items the customer chose to add
// role: 'customer' | 'agency'
// markupRates: { agency_markup_percent, customer_markup_percent } (from settings)
function calculateTourPrice({ tour, partySize = 1, selectedOptionalIds = [], role = 'customer', markupRates } = {}) {
  const n = Math.max(1, Number(partySize) || 1);
  const vehicleTiers = (tour && tour.vehicle_tiers) || [];
  const fixedCosts = (tour && tour.fixed_costs) || [];
  const optionalCosts = (tour && tour.optional_costs) || [];

  const vehicleTier = pickVehicleTier(vehicleTiers, n);
  const vehicleCost = vehicleTier ? Number(vehicleTier.cost) || 0 : 0;
  const otherFixedTotal = fixedCosts.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const fixedTotal = vehicleCost + otherFixedTotal;

  const markupPercent = markupPercentForRole(role, markupRates);
  const fixedWithMarkup = fixedTotal * (1 + markupPercent / 100);

  const selectedSet = new Set((selectedOptionalIds || []).map((v) => String(v)));
  const selectedOptionalItems = optionalCosts
    .filter((c) => selectedSet.has(String(c.id)))
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      cost_per_person: Number(c.cost_per_person) || 0,
      line_total: round2((Number(c.cost_per_person) || 0) * n),
    }));
  const optionalTotal = selectedOptionalItems.reduce((sum, c) => sum + c.line_total, 0);

  const total = fixedWithMarkup + optionalTotal;

  return {
    partySize: n,
    role,
    vehicleTier: vehicleTier
      ? { id: vehicleTier.id, vehicle_name: vehicleTier.vehicle_name, cost: vehicleCost }
      : null,
    fixedItems: fixedCosts.map((c) => ({ id: c.id, name: c.name, cost: Number(c.cost) || 0 })),
    fixedTotal: round2(fixedTotal),
    markupPercent,
    fixedWithMarkup: round2(fixedWithMarkup),
    selectedOptionalItems,
    optionalTotal: round2(optionalTotal),
    total: round2(total),
  };
}

// Faz 3 — Small Group tours (guaranteed departure).
// Confirmed formula: flat per-person price (tours.price) x guests, with NO
// role-based markup at all (unlike Private tours), plus any customer-picked
// optional_costs at raw per-person cost — same optional-items rule as
// Private tours. Guests simply join one of the existing scheduled
// departures; there is no vehicle tier / fixed cost concept here.
// tour: { price, optional_costs }
// partySize: number of guests booking
// selectedOptionalIds: ids of optional_costs items the customer chose to add
function calculateSmallGroupPrice({ tour, partySize = 1, selectedOptionalIds = [] } = {}) {
  const n = Math.max(1, Number(partySize) || 1);
  const pricePerPerson = Number(tour && tour.price) || 0;
  const optionalCosts = (tour && tour.optional_costs) || [];

  const baseTotal = pricePerPerson * n;

  const selectedSet = new Set((selectedOptionalIds || []).map((v) => String(v)));
  const selectedOptionalItems = optionalCosts
    .filter((c) => selectedSet.has(String(c.id)))
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      cost_per_person: Number(c.cost_per_person) || 0,
      line_total: round2((Number(c.cost_per_person) || 0) * n),
    }));
  const optionalTotal = selectedOptionalItems.reduce((sum, c) => sum + c.line_total, 0);

  const total = baseTotal + optionalTotal;

  return {
    partySize: n,
    bookingType: 'small_group',
    pricePerPerson,
    baseTotal: round2(baseTotal),
    selectedOptionalItems,
    optionalTotal: round2(optionalTotal),
    total: round2(total),
  };
}

module.exports = { calculateTourPrice, calculateSmallGroupPrice, pickVehicleTier, round2 };
