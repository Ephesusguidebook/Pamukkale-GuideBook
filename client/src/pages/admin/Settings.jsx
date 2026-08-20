import { useEffect, useState } from 'react';
import api from '../../api';
import MediaField from '../../components/MediaField';

const empty = {
  consultant_name: '',
  consultant_title: '',
  consultant_phone: '',
  consultant_whatsapp: '',
  consultant_email: '',
  consultant_photo: '',
  whatsapp_button_phone: '',
  notification_email: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  facebook_url: '',
  instagram_url: '',
  site_logo: '',
  site_favicon: '',
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
  const logoAsList = form.site_logo ? [{ url: form.site_logo }] : [];
  const faviconAsList = form.site_favicon ? [{ url: form.site_favicon }] : [];

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <h2 className="font-semibold text-gray-800">Branding</h2>
        <p className="text-xs text-gray-500">
          Chosen from the Media Library. Leave empty to use the default "TurRota" text logo /
          browser favicon.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Site Logo</label>
            <MediaField
              images={logoAsList}
              multiple={false}
              onChange={(imgs) => update('site_logo', imgs[0]?.url || '')}
            />
          </div>
          <div>
            <label className="label">Favicon</label>
            <MediaField
              images={faviconAsList}
              multiple={false}
              onChange={(imgs) => update('site_favicon', imgs[0]?.url || '')}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">Travel Consultant Card</h2>
          <p className="text-xs text-gray-500">
            This information is shown in the "Travel Consultant" card on every tour detail page.
          </p>
          <div className="mt-3">
            <label className="label">Photo</label>
            <MediaField
              images={photoAsList}
              multiple={false}
              onChange={(imgs) => update('consultant_photo', imgs[0]?.url || '')}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">WhatsApp Button</h2>
          <p className="mt-1 text-xs text-gray-500">
            A floating WhatsApp button appears on every page of the site once you set a phone
            number here. This same number is also used for the WhatsApp icon on the Contact
            page and footer. Leave empty to hide it everywhere.
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
          <h2 className="font-semibold text-gray-800">Contact Page Info</h2>
          <p className="mt-1 text-xs text-gray-500">
            Shown at the top of the Contact page. Leave any field empty to hide it.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
                placeholder="info@example.com"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input
                className="input"
                placeholder="+90 5xx xxx xx xx"
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input
                className="input"
                placeholder="Street, City, Country"
                value={form.contact_address}
                onChange={(e) => update('contact_address', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">Social Links</h2>
          <p className="mt-1 text-xs text-gray-500">
            Shown as icon buttons on the Contact page and in the site footer. Leave a field
            empty to hide that icon.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Facebook URL</label>
              <input
                className="input"
                placeholder="https://facebook.com/yourpage"
                value={form.facebook_url}
                onChange={(e) => update('facebook_url', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Instagram URL</label>
              <input
                className="input"
                placeholder="https://instagram.com/yourpage"
                value={form.instagram_url}
                onChange={(e) => update('instagram_url', e.target.value)}
              />
            </div>
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
