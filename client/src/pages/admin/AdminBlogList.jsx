import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminBlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/admin/blog')
      .then((res) => setPosts(res.data))
      .catch(() => setError('Could not load blog posts.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(post) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${post.title}"?\n\n` +
          `Its page (/blog/${post.slug}) will start returning "not found". If it's linked to ` +
          `from elsewhere, add a redirect afterwards in Admin > Redirects.`
      )
    )
      return;
    try {
      await api.delete(`/admin/blog/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      alert('Delete failed.');
    }
  }

  async function toggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.put(`/admin/blog/${post.id}`, { ...post, status: newStatus });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? res.data : p)));
    } catch {
      alert('Could not update status.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/redirects" className="text-xs text-gray-500 hover:text-teal-700">
            Deleted or renamed one? Add a redirect →
          </Link>
          <Link to="/admin/blog/new" className="btn-primary">
            + Add Blog Post
          </Link>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <div className="card p-10 text-center text-gray-500">
          No blog posts added yet. Start with "Add Blog Post".
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {post.cover_image ? (
                  <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.title}</p>
                <p className="text-sm text-gray-500">{post.author || 'No author set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(post)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  post.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {post.status === 'published' ? 'Published' : 'Draft'}
              </button>
              <Link to={`/admin/blog/${post.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
                Edit
              </Link>
              <button
                onClick={() => handleDelete(post)}
                className="btn-danger !px-3 !py-1.5 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
