import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import MediaField from '../../components/MediaField';
import ItineraryEditor from '../../components/ItineraryEditor';
import RouteEditor from '../../components/RouteEditor';
import CostPricingEditor from '../../components/CostPricingEditor';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { TOUR_TYPES } from '../../lib/tourRouting';

const emptyItem = {
  title: '',
  type: 'package',
  departure_point: '',
  summary: '',
  description: '',
  price: '',
  original_price: '',
  price_note: '',
  currency: 'USD',
  duration_days: 1,
  location: '',
  start_date: '',
  capacity: '',
  status: 'draft',
  languages: [],
  highlights: [],
  included: [],
  excluded: [],
  images: [],
  itinerary: [],
  route: [],
  vehicle_tiers: [],
  fixed_costs: [],
  optional_costs: [],
  // Faz 3 — Private (cost/pricing engine, per-passenger vehicle+markup) or
  // Small Group (flat guaranteed-departure price, no markup).
  booking_type: 'private',
  is_featured: false,
  destination_id: '',
  seo_title: '',
  seo_description: '',
};

// Converts a list to newline-separated text and back (for textarea fields).
function listToText(list) {
  return (list || []).join('\n');
}
function textToList(text) {
  return text
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
}

// Generic admin create/edit form reused for Package Tours, Daily Tours and
// Activities — each still saves to its own API base (category.adminApiBase).
export default function AdminCategoryForm({ category }) {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyItem);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api
      .get('/admin/destinations')
      .then((res) => setDestinations(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setForm(emptyItem);
    if (!isEdit) return;
    setLoading(true);
    api
      .get(`${category.adminApiBase}/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          ...emptyItem,
          ...t,
          type: t.type || 'package',
          departure_point: t.departure_point || '',
          price: t.price ?? '',
          original_price: t.original_price || '',
          capacity: t.capacity ?? '',
          images: t.images || [],
          itinerary: t.itinerary || [],
          route: t.route || [],
          vehicle_tiers: t.vehicle_tiers || [],
          fixed_costs: t.fixed_costs || [],
          optional_costs: t.optional_costs || [],
          booking_type: t.booking_type === 'small_group' ? 'small_group' : 'private',
          is_featured: !!t.is_featured,
          destination_id: t.destination_id || '',
          languages: t.languages || [],
          highlights: t.highlights || [],
          included: t.included || [],
          excluded: t.excluded || [],
          seo_title: t.seo_title || '',
          seo_description: t.seo_description || '',
        });
      })
      .catch(() => setError(`Could not load this ${category.label.toLowerCase()}.`))
      .finally(() => setLoading(false));
  }, [id, isEdit, category.adminApiBase, category.label]);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`${category.adminApiBase}/${id}/availability`)
      .then((res) => setAvailabilityMap(res.data))
      .catch(() => {});
  }, [id, isEdit, category.adminApiBase]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAvailabilityChange(date, status) {
    // Optimistic update, same pattern as Transfer's admin form.
    setAvailabilityMap((m) => {
      const next = { ...m };
      if (status === 'available') delete next[date];
      else next[date] = status;
      return next;
    });
    if (!isEdit) return; // new/unsaved tour — availability can only be set after it has an id
    try {
      await api.put(`${category.adminApiBase}/${id}/availability`, { date, status });
    } catch {
      alert('Could not save availability for that date.');
    }
  }

  async function handleSubmit(e, statusOverride) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        status: statusOverride || form.status,
        cover_image: form.images[0]?.url || '',
      };
      let saved;
      if (isEdit) {
        saved = (await api.put(`${category.adminApiBase}/${id}`, payload)).data;
      } else {
        saved = (await api.post(category.adminApiBase, payload)).data;
      }
      // Stay on the (now-edit) form after a create, same as Transfer's admin
      // form — the tour needs a saved id before its availability calendar
      // can be used.
      navigate(`${category.adminPath}/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? `Edit ${category.label}` : `Add ${category.label}`}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
              >
                {TOUR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Shown at /tours/{TOUR_TYPES.find((t) => t.value === form.type)?.urlSlug} and mixed
                into the main /tours listing.
              </p>
            </div>
            <div>
              <label className="label">Departure Point</label>
              <input
                className="input"
                placeholder="e.g. Kusadasi"
                value={form.departure_point}
                onChange={(e) => update('departure_point', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Adds this tour to the /tours/from-{'{'}place{'}'} filter (e.g. "Kusadasi"
                → /tours/from-kusadasi). Leave empty if not relevant.
              </p>
            </div>
          </div>
          <div>
            <label className="label">Destination (Things To Do)</label>
            <select
              className="input"
              value={form.destination_id}
              onChange={(e) => update('destination_id', e.target.value)}
            >
              <option value="">No destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Optional. Shows this tour as a card in the "Things To Do" section on the chosen
              destination's page.
            </p>
          </div>
          <div>
            <label className="label">Short Summary</label>
            <input
              className="input"
              placeholder="Shown on listing cards"
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Overview</label>
            <textarea
              className="input"
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.is_featured}
              onChange={(e) => update('is_featured', e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">Featured on homepage</span>
              <span className="block text-xs text-gray-500">
                Shows this tour in the "Popular Tours" section on the homepage.
              </span>
            </span>
          </label>
          <div>
            <label className="label">Languages (comma-separated — e.g. EN, TR, ES)</label>
            <input
              className="input"
              value={form.languages.join(', ')}
              onChange={(e) =>
                update(
                  'languages',
                  e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                )
              }
            />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Booking Type</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-lg border p-3 text-sm ${form.booking_type === 'private' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="booking_type"
                  checked={form.booking_type === 'private'}
                  onChange={() => update('booking_type', 'private')}
                />
                <span className="font-semibold text-gray-800">Private</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Fiyat, aşağıdaki Maliyet ve Fiyatlandırma bölümünde tanımlanan araç/sabit maliyetler ve
                rol bazlı kâr oranıyla hesaplanır.
              </p>
            </label>
            <label
              className={`cursor-pointer rounded-lg border p-3 text-sm ${form.booking_type === 'small_group' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="booking_type"
                  checked={form.booking_type === 'small_group'}
                  onChange={() => update('booking_type', 'small_group')}
                />
                <span className="font-semibold text-gray-800">Small Group</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Garanti kalkışlı tur. Misafirler var olan gruba dahil edilir, sabit kişi başı fiyat
                (aşağıdaki "Price") × kişi sayısı uygulanır, kâr oranı eklenmez.
              </p>
            </label>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Price and Capacity</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="label">Price (current)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Original Price (optional)</label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="To show a discount"
                value={form.original_price}
                onChange={(e) => update('original_price', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="label">Duration (days)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.duration_days}
                onChange={(e) => update('duration_days', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Price Note</label>
              <input
                className="input"
                placeholder="e.g. Based on double occupancy"
                value={form.price_note}
                onChange={(e) => update('price_note', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.capacity}
                onChange={(e) => update('capacity', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="e.g. Pamukkale"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Highlights</h2>
          <p className="text-xs text-gray-500">One item per line (e.g. Istanbul).</p>
          <textarea
            className="input"
            rows={4}
            placeholder={'Istanbul\nKusadasi\nPamukkale'}
            value={listToText(form.highlights)}
            onChange={(e) => update('highlights', textToList(e.target.value))}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Included / Excluded</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Included (one item per line)</label>
              <textarea
                className="input"
                rows={6}
                placeholder={'Tour Guide\nDomestic Flights\nEntrance Fees'}
                value={listToText(form.included)}
                onChange={(e) => update('included', textToList(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Excluded (one item per line)</label>
              <textarea
                className="input"
                rows={6}
                placeholder={'Optional Tours\nDinners\nTips'}
                value={listToText(form.excluded)}
                onChange={(e) => update('excluded', textToList(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Images</h2>
          <p className="text-xs text-gray-500">
            Chosen from the Media Library — upload photos there first if you don't see what
            you need.
          </p>
          <MediaField images={form.images} onChange={(imgs) => update('images', imgs)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Itinerary</h2>
          <ItineraryEditor days={form.itinerary} onChange={(days) => update('itinerary', days)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Route (Map)</h2>
          <RouteEditor points={form.route} onChange={(pts) => update('route', pts)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Maliyet ve Fiyatlandırma</h2>
          <p className="text-xs text-gray-500">
            {form.booking_type === 'small_group'
              ? 'Small Group turlarda fiyat, yukarıdaki "Price" alanından kişi başı olarak belirlenir. Burada sadece isteğe bağlı kalemleri yönetebilirsiniz.'
              : 'Bu turun rezervasyon fiyatının nasıl hesaplanacağını buradan yapılandırın — araç ve diğer sabit maliyetlere rol bazlı kâr oranı uygulanır, isteğe bağlı kalemler ham maliyetiyle eklenir.'}
          </p>
          <CostPricingEditor
            vehicleTiers={form.vehicle_tiers}
            fixedCosts={form.fixed_costs}
            optionalCosts={form.optional_costs}
            onChangeVehicleTiers={(v) => update('vehicle_tiers', v)}
            onChangeFixedCosts={(v) => update('fixed_costs', v)}
            onChangeOptionalCosts={(v) => update('optional_costs', v)}
            bookingType={form.booking_type}
            basePricePerPerson={Number(form.price) || 0}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Müsaitlik (Availability)</h2>
          <p className="text-xs text-gray-500">
            Bu tarih takvimi hem Private hem Small Group turlar için kullanılır — müşteri booking
            widget'ında sadece "Available" işaretli tarihleri seçebilir.
          </p>
          {isEdit ? (
            <AvailabilityCalendar mode="admin" availabilityMap={availabilityMap} onStatusChange={handleAvailabilityChange} />
          ) : (
            <p className="text-sm text-gray-500">Müsaitlik takvimini düzenlemek için önce turu kaydedin.</p>
          )}
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">SEO</h2>
          <p className="text-xs text-gray-500">
            Controls the browser tab title and search-result snippet for this page. Leave
            empty to fall back to the title and summary above.
          </p>
          <div>
            <label className="label">SEO Title</label>
            <input
              className="input"
              placeholder={form.title || 'Defaults to the title above'}
              value={form.seo_title}
              onChange={(e) => update('seo_title', e.target.value)}
            />
          </div>
          <div>
            <label className="label">SEO Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder={form.summary || 'Defaults to the summary above'}
              value={form.seo_description}
              onChange={(e) => update('seo_description', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            className="btn-secondary"
            disabled={saving}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
