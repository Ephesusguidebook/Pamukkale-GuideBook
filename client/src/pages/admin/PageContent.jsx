import { useEffect, useState } from 'react';
import api from '../../api';

const PAGES = [
  { key: 'home', label: 'Home' },
  { key: 'tours', label: 'Tours (/tours)' },
  { key: 'blog', label: 'Blog' },
  { key: 'aboutUs', label: 'About Us' },
  { key: 'contact', label: 'Contact' },
  { key: 'terms', label: 'Terms and Conditions' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'faq', label: 'FAQ' },
];

export default function PageContent() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/page-content')
      .then((res) => setForm(res.data))
      .catch(() => setError('Could not load page content.'))
      .finally(() => setLoading(false));
  }, []);

  function update(page, field, value) {
    setForm((f) => ({ ...f, [page]: { ...f[page], [field]: value } }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/admin/page-content', form);
      setForm(res.data);
      setSaved(true);
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Content</h1>
      <p className="mb-6 text-sm text-gray-500">
        Edit the headline (H1) and intro paragraph shown at the top of each page, without
        touching any code.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {PAGES.map((page) => (
          <div key={page.key} className="card space-y-3 p-6">
            <h2 className="font-semibold text-gray-800">{page.label}</h2>
            <div>
              <label className="label">Headline (H1)</label>
              <input
                className="input"
                value={form[page.key]?.h1 || ''}
                onChange={(e) => update(page.key, 'h1', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Intro Paragraph</label>
              <textarea
                className="input"
                rows={2}
                value={form[page.key]?.p || ''}
                onChange={(e) => update(page.key, 'p', e.target.value)}
              />
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                SEO
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">SEO Title</label>
                  <input
                    className="input"
                    placeholder={form[page.key]?.h1 || 'Defaults to the headline above'}
                    value={form[page.key]?.seo_title || ''}
                    onChange={(e) => update(page.key, 'seo_title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">SEO Description</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder={form[page.key]?.p || 'Defaults to the intro paragraph above'}
                    value={form[page.key]?.seo_description || ''}
                    onChange={(e) => update(page.key, 'seo_description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-teal-700">Saved.</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
