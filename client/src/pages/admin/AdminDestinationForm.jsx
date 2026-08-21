import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import MediaField from '../../components/MediaField';
import FaqEditor from '../../components/FaqEditor';

const emptyItem = {
  title: '',
  summary: '',
  description: '',
  visitor_information: '',
  images: [],
  faq: [],
  status: 'draft',
  seo_title: '',
  seo_description: '',
};

export default function AdminDestinationForm() {
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
      .get(`/admin/destinations/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          ...emptyItem,
          ...t,
          images: t.images || [],
          faq: t.faq || [],
        });
      })
      .catch(() => setError('Could not load this destination.'))
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
        await api.put(`/admin/destinations/${id}`, payload);
      } else {
        await api.post('/admin/destinations', payload);
      }
      navigate('/admin/destinations');
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
        {isEdit ? 'Edit Destination' : 'Add Destination'}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">Başlık</h2>
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => update('title', e.target.value)} />
            {isEdit && form.slug && <p className="mt-1 text-xs text-gray-400">/destinations/{form.slug}</p>}
          </div>
          <div>
            <label className="label">Short Summary</label>
            <input
              className="input"
              placeholder="Shown on the destinations listing card and as the SEO fallback description"
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Paragraf 1</h2>
          <p className="text-xs text-gray-500">Destinasyonun ana tanıtım metni.</p>
          <textarea
            className="input"
            rows={6}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Visitor Information</h2>
          <textarea
            className="input"
            rows={5}
            placeholder="Ulaşım, en iyi ziyaret zamanı, pratik ipuçları..."
            value={form.visitor_information}
            onChange={(e) => update('visitor_information', e.target.value)}
          />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Galeri</h2>
          <p className="text-xs text-gray-500">
            Medya Kütüphanesi'nden seçilir. İlk görsel kapak fotoğrafı olarak kullanılır. Bu
            destinasyona bağlı Attractions kartları ayrıca kendi görselleriyle otomatik listelenir.
          </p>
          <MediaField images={form.images} onChange={(imgs) => update('images', imgs)} />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">FAQ</h2>
          <FaqEditor items={form.faq} onChange={(v) => update('faq', v)} />
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">SEO</h2>
          <p className="text-xs text-gray-500">
            Controls the browser tab title and search-result snippet. Leave empty to fall back to
            the title and summary above.
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
