// Package Tours, Daily Tours and Activities used to be three separate
// sections (separate nav items, separate admin screens, separate data).
// They're now one unified "Tours" section at /tours, with type and
// departure-point as filters instead. This file is the single source of
// truth for that type metadata and for classifying a /tours/:segment URL
// piece as a type filter, a departure filter, or (if neither) a candidate
// tour detail slug — kept in sync with the equivalent server-side logic in
// server/index.js (classifyToursSegment/isKnownToursPath).

export const TOUR_TYPES = [
  {
    value: 'package',
    urlSlug: 'package',
    label: 'Package Tour',
    pluralLabel: 'Package Tours',
    intro: 'Multi-day, all-inclusive tour packages covering the best destinations in Turkey.',
  },
  {
    value: 'daily',
    urlSlug: 'daily',
    label: 'Daily Tour',
    pluralLabel: 'Daily Tours',
    intro: 'Single-day guided tours — see the highlights without an overnight stay.',
  },
  {
    value: 'activity',
    urlSlug: 'activities',
    label: 'Activity',
    pluralLabel: 'Activities',
    intro: 'Standalone experiences and activities you can add to your trip.',
  },
];

export const TOUR_TYPE_BY_VALUE = Object.fromEntries(TOUR_TYPES.map((t) => [t.value, t]));
const TOUR_TYPE_BY_URL_SLUG = Object.fromEntries(TOUR_TYPES.map((t) => [t.urlSlug, t]));

// Maps a tour's `type` to the historical contact-message item_type strings
// (package_tour/daily_tour/activity), preserved so the Admin > Messages
// screen and its enquiry-type reporting keep working unchanged.
export const TYPE_TO_CONTACT_ITEM_TYPE = {
  package: 'package_tour',
  daily: 'daily_tour',
  activity: 'activity',
};

// A single "category"-shaped config for the generic AdminCategoryList /
// AdminCategoryForm components (which used to be instantiated three times,
// once per old category) — now there's just this one.
export const TOURS_ADMIN_CATEGORY = {
  key: 'tours',
  label: 'Tour',
  pluralLabel: 'Tours',
  publicPath: '/tours',
  adminPath: '/admin/tours',
  adminApiBase: '/admin/tours',
};

// Classifies one /tours/:segment URL piece.
export function classifySegment(seg) {
  if (!seg) return null;
  const type = TOUR_TYPE_BY_URL_SLUG[seg];
  if (type) return { kind: 'type', value: type.value };
  if (seg.startsWith('from-') && seg.length > 5) {
    return { kind: 'departure', value: seg.slice(5) };
  }
  return null;
}
