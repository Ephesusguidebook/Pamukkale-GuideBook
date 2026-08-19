import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import useJsonLd from '../lib/useJsonLd';

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

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get(`/blog/${slug}`)
      .then((res) => {
        if (active) setPost(res.data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useJsonLd(
    post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.cover_image || undefined,
          author: post.author ? { '@type': 'Person', name: post.author } : undefined,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
        }
      : null
  );

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-gray-500 sm:px-6">Loading...</div>;
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
        <p className="mt-2 text-gray-500">
          This blog post may have been removed or is not published.
        </p>
        <Link to="/blog" className="btn-primary mt-6 inline-flex">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/blog" className="hover:text-teal-700">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{post.title}</span>
      </nav>

      {post.cover_image && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
          <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      <h1 className="mt-8 text-3xl font-bold text-gray-900">{post.title}</h1>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
        <span>{formatDate(post.created_at)}</span>
        {post.author && <span>· By {post.author}</span>}
      </div>

      <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">
        {post.content}
      </div>
    </article>
  );
}
