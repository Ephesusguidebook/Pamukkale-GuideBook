// Shared configuration for the three independent tour-like content types.
// Each still has its own API base, its own admin screens and its own data
// collection on the server — this config just drives the generic list/detail
// and admin components so the UI stays consistent across all three.

export const CATEGORIES = {
  packageTours: {
    key: 'package-tours',
    pageKey: 'packageTours',
    label: 'Package Tour',
    pluralLabel: 'Package Tours',
    publicPath: '/package-tours',
    adminPath: '/admin/package-tours',
    apiBase: '/package-tours',
    adminApiBase: '/admin/package-tours',
    contactItemType: 'package_tour',
    heading: 'Package Tours',
    intro:
      'Multi-day, all-inclusive tour packages covering the best destinations in Turkey.',
    emptyMessage: 'No package tours published yet. Check back soon!',
    searchPlaceholder: 'Search package tours or a location...',
  },
  dailyTours: {
    key: 'daily-tours',
    pageKey: 'dailyTours',
    label: 'Daily Tour',
    pluralLabel: 'Daily Tours',
    publicPath: '/daily-tours',
    adminPath: '/admin/daily-tours',
    apiBase: '/daily-tours',
    adminApiBase: '/admin/daily-tours',
    contactItemType: 'daily_tour',
    heading: 'Daily Tours',
    intro: 'Single-day guided tours — see the highlights without an overnight stay.',
    emptyMessage: 'No daily tours published yet. Check back soon!',
    searchPlaceholder: 'Search daily tours or a location...',
  },
  activities: {
    key: 'activities',
    pageKey: 'activities',
    label: 'Activity',
    pluralLabel: 'Activities',
    publicPath: '/activities',
    adminPath: '/admin/activities',
    apiBase: '/activities',
    adminApiBase: '/admin/activities',
    contactItemType: 'activity',
    heading: 'Activities',
    intro: 'Standalone experiences and activities you can add to your trip.',
    emptyMessage: 'No activities published yet. Check back soon!',
    searchPlaceholder: 'Search activities or a location...',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
