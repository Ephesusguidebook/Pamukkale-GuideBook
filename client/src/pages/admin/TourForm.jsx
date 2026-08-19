import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import ImageUploader from '../../components/ImageUploader';
import ItineraryEditor from '../../components/ItineraryEditor';

const emptyTour = {
  title: '',
  summary: '',
  description: '',
  price: '',
  currency: 'TRY',
  duration_days: 1,
  location: '',
  start_date: '',
  capacity: '',
  status: 'draft',
  images: [],
  itinerary: [],
};

export default function TourForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'yeni';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyTour);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/admin/tours/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          ...emptyTour,
          ...t,
          price: t.price ?? '',
          capacity: t.capacity ?? '',
          images: t.images || [],
          itinerary: t.itinerary || [],
        });
      })
      .catch(() => setError('Tur bilgileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e, statusOverride) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Başlık zorunlu.');
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
        await api.put(`/admin/tours/${id}`, payload);
      } else {
        await api.post('/admin/tours', payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Yükleniyor...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? 'Turu Düzenle' : 'Yeni Tur Ekle'}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Temel Bilgiler</h2>
          <div>
            <label className="label">Tur Başlığı *</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Kısa Özet</label>
            <input
              className="input"
              placeholder="Liste kartlarında görünecek kısa açıklama"
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Detaylı Açıklama</label>
            <textarea
              className="input"
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Fiyat ve Kapasite</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="label">Fiyat</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Para Birimi</label>
              <select
                className="input"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="label">Süre (gün)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.duration_days}
                onChange={(e) => update('duration_days', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Kontenjan</label>
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
              <label className="label">Lokasyon</label>
              <input
                className="input"
                placeholder="Örn: Kapadokya"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Başlangıç Tarihi</label>
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
          <h2 className="font-semibold text-gray-800">Görseller</h2>
          <ImageUploader images={form.images} onChange={(imgs) => update('images', imgs)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Gün Gün Program</h2>
          <ItineraryEditor
            days={form.itinerary}
            onChange={(days) => update('itinerary', days)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            className="btn-secondary"
            disabled={saving}
          >
            Taslak Olarak Kaydet
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Yayınla'}
          </button>
        </div>
      </form>
    </div>
  );
}
