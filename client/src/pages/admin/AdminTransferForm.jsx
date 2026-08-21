import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import CostPricingEditor from '../../components/CostPricingEditor';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';

const emptyItem = {
  title: '',
  pickup_location: '',
  dropoff_location: '',
  duration_text: '',
  distance_km: '',
  summary: '',
  description: '',
  currency: 'EUR',
  status: 'draft',
  vehicle_tiers: [],
  fixed_costs: [],
  optional_costs: [],
  is_featured: false,
  seo_title: '',
  seo_description: '',
};

export default function AdminTransferForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyItem);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState({});

  useEffect(() => {
    setForm(emptyItem);
    if (!isEdit) return;
    setLoading(true);
    api
      .get(`/admin/transfer-routes/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          ...emptyItem,
          ...t,
          distance_km: t.distance_km ?? '',
          vehicle_tiers: t.vehicle_tiers || [],
          fixed_costs: t.fixed_costs || [],
          optional_costs: t.optional_costs || [],
          is_featured: !!t.is_featured,
        });
      })
      .catch(() => setError('Could not load this transfer route.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/admin/transfer-routes/${id}/availability`)
      .then((res) => setAvailabilityMap(res.data))
      .catch(() => {});
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAvailabilityChange(date, status) {
    // Optimistic update — a transfer route usually has many dates set over
    // time, and waiting on a round-trip per click would feel sluggish.
    setAvailabilityMap((m) => {
      const next = { ...m };
      if (status === 'available') delete next[date];
      else next[date] = status;
      return next;
    });
    if (!isEdit) return; // new/unsaved route — availability can only be set after it has an id
    try {
      await api.put(`/admin/transfer-routes/${id}/availability`, { date, status });
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
    if (!form.pickup_location.trim() || !form.dropoff_location.trim()) {
      setError('Pick-up and Drop-off locations are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, status: statusOverride || form.status };
      let saved;
      if (isEdit) {
        saved = (await api.put(`/admin/transfer-routes/${id}`, payload)).data;
      } else {
        saved = (await api.post('/admin/transfer-routes', payload)).data;
      }
      navigate(`/admin/transfers/${saved.id}`, { replace: true });
      if (!isEdit) return; // navigate will remount with isEdit=true and load availability normally
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
        {isEdit ? 'Edit Transfer Route' : 'Add Transfer Route'}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Route</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Pick-up Location *</label>
              <input
                className="input"
                required
                placeholder="Izmir Cruise Port"
                value={form.pickup_location}
                onChange={(e) => update('pickup_location', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Drop-off Location *</label>
              <input
                className="input"
                required
                placeholder="Bergama"
                value={form.dropoff_location}
                onChange={(e) => update('dropoff_location', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              required
              placeholder="Izmir Cruise Port to Bergama Private Transfer Service"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Shown as the page heading and in Admin lists.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Duration</label>
              <input
                className="input"
                placeholder="1hr 30min"
                value={form.duration_text}
                onChange={(e) => update('duration_text', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Distance (km)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.distance_km}
                onChange={(e) => update('distance_km', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Short Summary</label>
            <input
              className="input"
              placeholder="Shown on the route card"
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="label">About This Transfer</label>
            <textarea
              className="input"
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input max-w-[10rem]" value={form.currency} onChange={(e) => update('currency', e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="TRY">TRY</option>
              <option value="GBP">GBP</option>
            </select>
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
                Shows this route in the "Transfers" section on the homepage.
              </span>
            </span>
          </label>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Maliyet ve Fiyatlandırma</h2>
          <p className="text-xs text-gray-500">
            Araç kademeleri (Vito/Sprinter) ve diğer sabit maliyetlere rol bazlı kâr oranı uygulanır;
            isteğe bağlı kalemler (örn. bebek koltuğu) ham maliyetiyle eklenir.
          </p>
          <CostPricingEditor
            vehicleTiers={form.vehicle_tiers}
            fixedCosts={form.fixed_costs}
            optionalCosts={form.optional_costs}
            onChangeVehicleTiers={(v) => update('vehicle_tiers', v)}
            onChangeFixedCosts={(v) => update('fixed_costs', v)}
            onChangeOptionalCosts={(v) => update('optional_costs', v)}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Müsaitlik (Availability)</h2>
          {isEdit ? (
            <AvailabilityCalendar mode="admin" availabilityMap={availabilityMap} onStatusChange={handleAvailabilityChange} />
          ) : (
            <p className="text-sm text-gray-500">Müsaitlik takvimini düzenlemek için önce rotayı kaydedin.</p>
          )}
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">SEO</h2>
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
          <button type="button" onClick={(e) => handleSubmit(e, 'draft')} className="btn-secondary" disabled={saving}>
            Save as Draft
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'published')} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
