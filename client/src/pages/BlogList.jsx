import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function BlogList() {
  const { h1, p, seo_title, seo_description } = usePageContent('blog', {
    h1: 'Blog',
    p: 'Travel tips, destination guides and stories from around Turkey.',
  });
  useSeo(seo_title || h1, seo_description || p);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/blog')
      .then((res) => {
        if (active) setPosts(res.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading the blog.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">{p}</p>

      {loading && <p className="mt-8 text-gray-500">Loading...</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="mt-8 text-gray-500">No blog posts published yet. Check back soon!</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                {formatDate(post.created_at)}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
