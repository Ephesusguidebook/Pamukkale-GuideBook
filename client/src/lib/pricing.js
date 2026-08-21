// Client-side mirror of server/lib/pricing.js — used ONLY for the instant
// live preview in the admin Cost & Pricing editor (recalculated on every
// keystroke, no server round-trip). The server copy is the real source of
// truth for anything that actually charges money later (booking totals);
// keep the two in sync, the same way classifyToursSegment (server) and
// classifySegment (client) are kept in sync for /tours routing.
//
// Ödenecek Fiyat = (Sabit Maliyetler x (1 + Rol Bazlı Kar Oranı))
//                   + Seçilen İsteğe Bağlı Kalemler (ham maliyet)

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function pickVehicleTier(tiers, partySize) {
  const list = Array.isArray(tiers) ? tiers : [];
  if (list.length === 0) return null;
  const n = Math.max(1, Number(partySize) || 1);
  const fitting = list.filter((t) => n >= (Number(t.min_people) || 1) && (t.max_people == null || t.max_people === '' || n <= Number(t.max_people)));
  if (fitting.length > 0) {
    return fitting.slice().sort((a, b) => (a.max_people === null || a.max_people === '' ? Infinity : Number(a.max_people)) - (b.max_people === null || b.max_people === '' ? Infinity : Number(b.max_people)))[0];
  }
  return list.slice().sort((a, b) => (b.max_people === null || b.max_people === '' ? Infinity : Number(b.max_people)) - (a.max_people === null || a.max_people === '' ? Infinity : Number(a.max_people)))[0];
}

function markupPercentForRole(role, markupRates) {
  const rates = markupRates || {};
  if (role === 'agency') return Number(rates.agency_markup_percent) || 0;
  return Number(rates.customer_markup_percent) || 0;
}

export function calculateTourPrice({ tour, partySize = 1, selectedOptionalIds = [], role = 'customer', markupRates } = {}) {
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
    vehicleTier: vehicleTier ? { id: vehicleTier.id, vehicle_name: vehicleTier.vehicle_name, cost: vehicleCost } : null,
    fixedItems: fixedCosts.map((c) => ({ id: c.id, name: c.name, cost: Number(c.cost) || 0 })),
    fixedTotal: round2(fixedTotal),
    markupPercent,
    fixedWithMarkup: round2(fixedWithMarkup),
    selectedOptionalItems,
    optionalTotal: round2(optionalTotal),
    total: round2(total),
  };
}

export const OPTIONAL_COST_CATEGORIES = [
  { value: 'entrance', label: 'Giriş Ücreti' },
  { value: 'food', label: 'Yemek' },
  { value: 'extra', label: 'Tur Ekstrası' },
  { value: 'other', label: 'Diğer' },
];
