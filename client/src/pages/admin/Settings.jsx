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
  contact_response_time: '',
  facebook_url: '',
  instagram_url: '',
  site_logo: '',
  site_favicon: '',
  google_site_verification: '',
  ga4_measurement_id: '',
  google_ads_id: '',
  noindex_site: true,
  agency_markup_percent: 10,
  customer_markup_percent: 20,
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
        <div
          className={`rounded-lg border p-4 ${
            form.noindex_site
              ? 'border-amber-300 bg-amber-50'
              : 'border-teal-200 bg-teal-50'
          }`}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.noindex_site}
              onChange={(e) => update('noindex_site', e.target.checked)}
            />
            <span>
              <span className="block font-semibold text-gray-800">
                Site not finished yet — hide from search engines (noindex, nofollow)
              </span>
              <span className="mt-1 block text-xs text-gray-600">
                While this is checked, every page tells Google and other search engines not
                to index the site (via a <code>noindex</code> meta tag and header on every
                response), so it can't accidentally start showing up in search results before
                you're ready. This is on by default for a new deployment.{' '}
                <strong>
                  Remember to uncheck this and save once the site is finished and ready to go
                  live
                </strong>{' '}
                — otherwise it will stay hidden from search engines indefinitely.
              </span>
            </span>
          </label>
        </div>

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
            Shown as info cards at the top of the Contact page. Leave any field empty to hide
            its card — the WhatsApp / Phone card uses the WhatsApp number set above.
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
            <div className="sm:col-span-2">
              <label className="label">Response Time</label>
              <input
                className="input"
                placeholder="e.g. Within 24 hours"
                value={form.contact_response_time}
                onChange={(e) => update('contact_response_time', e.target.value)}
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

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">Rol Bazlı Kâr Oranı (Karlandırma)</h2>
          <p className="mt-1 text-xs text-gray-500">
            Her turun Maliyet ve Fiyatlandırma ekranında girilen sabit maliyetlere (araç + diğer sabit
            kalemler) uygulanacak kâr oranı. İsteğe bağlı kalemlere (giriş, yemek, ekstra) kâr
            eklenmez — ham maliyetiyle yansır.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Müşteri Kâr Oranı (%)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.customer_markup_percent}
                onChange={(e) => update('customer_markup_percent', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Acente Kâr Oranı (%)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.agency_markup_percent}
                onChange={(e) => update('agency_markup_percent', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-800">Search Console, Analytics &amp; Ads</h2>
          <p className="mt-1 text-xs text-gray-500">
            Paste just the code, or the whole snippet Google gives you — either works, the
            right part is picked out automatically. Saving here adds the tags to every page's
            &lt;head&gt;, exactly as Google's own setup instructions ask for.
          </p>
          <div className="mt-3 space-y-4">
            <div>
              <label className="label">Google Search Console verification code</label>
              <input
                className="input font-mono text-xs"
                placeholder='e.g. abcDEF123... or the full <meta name="google-site-verification" ...> tag'
                value={form.google_site_verification}
                onChange={(e) => update('google_site_verification', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                In Search Console, add a property, choose the "HTML tag" verification method, and
                paste what it gives you here — then click Verify on the Search Console side.
              </p>
            </div>
            <div>
              <label className="label">Google Analytics (GA4) Measurement ID</label>
              <input
                className="input font-mono text-xs"
                placeholder="G-XXXXXXXXXX"
                value={form.ga4_measurement_id}
                onChange={(e) => update('ga4_measurement_id', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Found in GA4 under Admin &gt; Data Streams &gt; your web stream.
              </p>
            </div>
            <div>
              <label className="label">Google Ads Conversion ID</label>
              <input
                className="input font-mono text-xs"
                placeholder="AW-XXXXXXXXX"
                value={form.google_ads_id}
                onChange={(e) => update('google_ads_id', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Found in Google Ads under Tools &amp; Settings &gt; Conversions &gt; your
                conversion action &gt; Tag setup.
              </p>
            </div>
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
