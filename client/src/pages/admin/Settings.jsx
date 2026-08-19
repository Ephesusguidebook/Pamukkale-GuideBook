import { useEffect, useState } from 'react';
import api from '../../api';
import ImageUploader from '../../components/ImageUploader';

const empty = {
  consultant_name: '',
  consultant_title: '',
  consultant_phone: '',
  consultant_whatsapp: '',
  consultant_email: '',
  consultant_photo: '',
  whatsapp_button_phone: '',
  notification_email: '',
};

export default function Settings() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setForm({ ...empty, ...res.data }))
      .catch(() => setError('Could not load settings.'))
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
      await api.put('/settings', form);
      setSaved(true);
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  // Reuse the (multi-image) uploader for a single consultant photo.
  const photoAsList = form.consultant_photo ? [{ url: form.consultant_photo }] : [];

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <h2 className="font-semibold text-gray-800">Travel Consultant Card</h2>
        <p className="text-xs text-gray-500">
          This information is shown in the "Travel Consultant" card on every tour detail page.
        </p>
        <div>
          <label className="label">Photo</label>
          <ImageUploader
            images={photoAsList}
            onChange={(imgs) => update('consultant_photo', imgs[0]?.url || '')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.consultant_name}
              onChange={(e) => update('consultant_name', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="e.g. Travel Consultant"
              value={form.consultant_title}
              onChange={(e) => update('consultant_title', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              placeholder="+90 5xx xxx xx xx"
              value={form.consultant_phone}
              onChange={(e) => update('consultant_phone', e.target.value)}
            />
          </div>
          <div>
            <label className="label">WhatsApp Number</label>
            <input
              className="input"
              placeholder="905xxxxxxxxx (no + or spaces)"
              value={form.consultant_whatsapp}
              onChange={(e) => update('consultant_whatsapp', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.consultant_email}
              onChange={(e) => update('consultant_email', e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">WhatsApp Button</h2>
          <p className="mt-1 text-xs text-gray-500">
            A floating WhatsApp button appears on every page of the site once you set a phone
            number here. Leave empty to hide the button.
          </p>
          <div className="mt-3">
            <label className="label">WhatsApp Number</label>
            <input
              className="input"
              placeholder="905xxxxxxxxx (no + or spaces)"
              value={form.whatsapp_button_phone}
              onChange={(e) => update('whatsapp_button_phone', e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">Lead Notifications</h2>
          <p className="mt-1 text-xs text-gray-500">
            Every contact form submission always appears under Admin &gt; Messages. If you also
            want an email alert, set an address here (requires SMTP to be configured on the
            server — see the README).
          </p>
          <div className="mt-3">
            <label className="label">Notification Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={form.notification_email}
              onChange={(e) => update('notification_email', e.target.value)}
            />
          </div>
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
