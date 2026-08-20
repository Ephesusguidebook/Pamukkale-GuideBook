import { useEffect, useState } from 'react';
import api from '../../api';

const empty = { llms_txt: '', robots_txt: '' };

export default function AdminSiteFiles() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/site-files')
      .then((res) => setForm({ ...empty, ...res.data }))
      .catch(() => setError('Could not load site files.'))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/admin/site-files', form);
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
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Site Files</h1>
      <p className="mb-6 text-sm text-gray-500">
        Edit the raw text served at these two well-known URLs, without a code change.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">llms.txt</h2>
          <p className="text-xs text-gray-500">
            Describes the site to AI assistants and crawlers (ChatGPT, Claude, Perplexity,
            etc.). Served publicly at <code className="rounded bg-gray-100 px-1">/llms.txt</code>.
          </p>
          <textarea
            className="input font-mono text-xs"
            rows={16}
            spellCheck={false}
            value={form.llms_txt}
            onChange={(e) => update('llms_txt', e.target.value)}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">robots.txt</h2>
          <p className="text-xs text-gray-500">
            Tells search engines which parts of the site they may crawl. Served publicly at{' '}
            <code className="rounded bg-gray-100 px-1">/robots.txt</code>. Be careful editing
            this — a mistake here can stop search engines from indexing the site.
          </p>
          <textarea
            className="input font-mono text-xs"
            rows={8}
            spellCheck={false}
            value={form.robots_txt}
            onChange={(e) => update('robots_txt', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-teal-700">Saved.</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
