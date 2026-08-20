import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import MediaField from '../../components/MediaField';

const emptyPost = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  status: 'draft',
  cover_image: '',
  seo_title: '',
  seo_description: '',
};

export default function AdminBlogForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyPost);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/admin/blog/${id}`)
      .then((res) => setForm({ ...emptyPost, ...res.data }))
      .catch(() => setError('Could not load this blog post.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Cover image is uploaded through the same multi-image uploader used
  // elsewhere, but a blog post only needs a single cover image.
  const coverAsList = form.cover_image ? [{ url: form.cover_image }] : [];

  async function handleSubmit(e, statusOverride) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, status: statusOverride || form.status };
      if (isEdit) {
        await api.put(`/admin/blog/${id}`, payload);
      } else {
        await api.post('/admin/blog', payload);
      }
      navigate('/admin/blog');
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
        {isEdit ? 'Edit Blog Post' : 'Add Blog Post'}
      </h1>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="card space-y-4 p-6">
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
            <label className="label">Excerpt</label>
            <input
              className="input"
              placeholder="Short summary shown on the blog listing"
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Author</label>
            <input
              className="input"
              value={form.author}
              onChange={(e) => update('author', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea
              className="input"
              rows={12}
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-gray-800">Cover Image</h2>
          <MediaField
            images={coverAsList}
            multiple={false}
            onChange={(imgs) => update('cover_image', imgs[0]?.url || '')}
          />
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-gray-800">SEO</h2>
          <p className="text-xs text-gray-500">
            Controls the browser tab title and search-result snippet for this post. Leave
            empty to fall back to the title and excerpt above.
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
              placeholder={form.excerpt || 'Defaults to the excerpt above'}
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
