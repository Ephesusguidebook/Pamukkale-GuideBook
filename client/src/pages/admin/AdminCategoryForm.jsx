import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import ImageUploader from '../../components/ImageUploader';
import ItineraryEditor from '../../components/ItineraryEditor';
import RouteEditor from '../../components/RouteEditor';

const emptyItem = {
  title: '',
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
          price: t.price ?? '',
          original_price: t.original_price || '',
          capacity: t.capacity ?? '',
          images: t.images || [],
          itinerary: t.itinerary || [],
          route: t.route || [],
          languages: t.languages || [],
          highlights: t.highlights || [],
          included: t.included || [],
          excluded: t.excluded || [],
        });
      })
      .catch(() => setError(`Could not load this ${category.label.toLowerCase()}.`))
      .finally(() => setLoading(false));
  }, [id, isEdit, category.adminApiBase, category.label]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
      if (isEdit) {
        await api.put(`${category.adminApiBase}/${id}`, payload);
      } else {
        await api.post(category.adminApiBase, payload);
      }
      navigate(category.adminPath);
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
          <ImageUploader images={form.images} onChange={(imgs) => update('images', imgs)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Itinerary</h2>
          <ItineraryEditor days={form.itinerary} onChange={(days) => update('itinerary', days)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Route (Map)</h2>
          <RouteEditor points={form.route} onChange={(pts) => update('route', pts)} />
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
