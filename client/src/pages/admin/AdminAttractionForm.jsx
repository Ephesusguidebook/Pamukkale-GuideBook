import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import MediaField from '../../components/MediaField';

const emptyItem = {
  title: '',
  destination_id: '',
  summary: '',
  description: '',
  entrance_fee: '',
  opening_hours: '',
  best_time: '',
  visitor_information: '',
  images: [],
  latitude: '',
  longitude: '',
  status: 'draft',
  seo_title: '',
  seo_description: '',
};

export default function AdminAttractionForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyItem);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      .get(`/admin/attractions/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          ...emptyItem,
          ...t,
          destination_id: t.destination_id || '',
          images: t.images || [],
          latitude: t.latitude ?? '',
          longitude: t.longitude ?? '',
        });
      })
      .catch(() => setError('Could not load this attraction.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

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
        await api.put(`/admin/attractions/${id}`, payload);
      } else {
        await api.post('/admin/attractions', payload);
      }
      navigate('/admin/attractions');
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
        {isEdit ? 'Edit Attraction' : 'Add Attraction'}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <div>
            <label className="label">Title (H1) *</label>
            <input className="input" required value={form.title} onChange={(e) => update('title', e.target.value)} />
            {isEdit && form.slug && <p className="mt-1 text-xs text-gray-400">/attraction/{form.slug}</p>}
          </div>
          <div>
            <label className="label">Destination (Location)</label>
            <select className="input" value={form.destination_id} onChange={(e) => update('destination_id', e.target.value)}>
              <option value="">No destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Shown automatically as this attraction's Location, and this attraction shows up as an
              Attraction card on the chosen destination's page.
            </p>
          </div>
          <div>
            <label className="label">Short Summary</label>
            <input
              className="input"
              placeholder="Shown on the attractions listing card and as the SEO fallback description"
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={6} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Giriş Ücreti - Açık Saatleri - Best Time</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Giriş Ücreti (Entrance Fee)</label>
              <input className="input" placeholder="e.g. €10 or Free" value={form.entrance_fee} onChange={(e) => update('entrance_fee', e.target.value)} />
            </div>
            <div>
              <label className="label">Açık Saatleri (Opening Hours)</label>
              <input className="input" placeholder="e.g. 08:30 - 18:30" value={form.opening_hours} onChange={(e) => update('opening_hours', e.target.value)} />
            </div>
            <div>
              <label className="label">Best Time</label>
              <input className="input" placeholder="e.g. Early morning" value={form.best_time} onChange={(e) => update('best_time', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Visitor Information</h2>
          <textarea
            className="input"
            rows={5}
            placeholder="Practical tips for visitors — what to bring, accessibility, crowds..."
            value={form.visitor_information}
            onChange={(e) => update('visitor_information', e.target.value)}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Photo Gallery</h2>
          <p className="text-xs text-gray-500">Medya Kütüphanesi'nden seçilir. İlk görsel kapak fotoğrafı olur.</p>
          <MediaField images={form.images} onChange={(imgs) => update('images', imgs)} />
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Google Maps — Canlı Konum</h2>
          <p className="text-xs text-gray-500">
            Enlem/Boylam girilirse, tur sayfasında bir Google Maps embed'i ve "Yakın Konumlar"
            (aynı destinasyondaki diğer attractions, mesafeye göre sıralı) otomatik gösterilir.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                step="any"
                className="input"
                placeholder="e.g. 37.9519"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="any"
                className="input"
                placeholder="e.g. 27.3672"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
              />
            </div>
          </div>
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
