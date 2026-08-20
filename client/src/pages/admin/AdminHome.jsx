import { Link } from 'react-router-dom';
import { CATEGORY_LIST } from '../../lib/categories';

const extraLinks = [
  { to: '/admin/blog', label: 'Blog Posts', description: 'Write and manage blog articles.' },
  { to: '/admin/messages', label: 'Messages', description: 'View enquiries sent through the site.' },
  { to: '/admin/media', label: 'Media Library', description: 'Upload and organize photos, converted to WebP automatically.' },
  { to: '/admin/redirects', label: 'Redirects', description: 'Send an old page URL to a new one after deleting or renaming it.' },
  { to: '/admin/traffic', label: 'Traffic & Crawlers', description: 'Bot/AI-crawler activity, crawl errors, and pages browsed per visitor session.' },
  { to: '/admin/logs', label: 'Activity Log', description: 'A record of admin logins and every create, update or delete.' },
  { to: '/admin/site-files', label: 'Site Files', description: 'Edit the llms.txt and robots.txt files served by the site.' },
  { to: '/admin/page-content', label: 'Page Content', description: 'Edit the H1 and intro paragraph on every page.' },
  { to: '/admin/settings', label: 'Settings', description: 'Update the travel consultant card.' },
];

export default function AdminHome() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Panel</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_LIST.map((category) => (
          <Link key={category.key} to={category.adminPath} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="font-semibold text-gray-900">{category.pluralLabel}</p>
            <p className="mt-1 text-sm text-gray-500">
              Manage {category.pluralLabel.toLowerCase()} shown at {category.publicPath}/
            </p>
          </Link>
        ))}
        {extraLinks.map((link) => (
          <Link key={link.to} to={link.to} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="font-semibold text-gray-900">{link.label}</p>
            <p className="mt-1 text-sm text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
