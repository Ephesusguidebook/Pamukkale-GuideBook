import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TourCard from '../components/TourCard';
import { TOUR_TYPES } from '../lib/tourRouting';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

function TypeSection({ type, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{type.pluralLabel}</h2>
        <Link
          to={`/tours/${type.urlSlug}`}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <TourCard key={item.id} tour={item} basePath="/tours" />
        ))}
      </div>
    </section>
  );
}

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

function BlogSection({ posts }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-gray-900">From the Blog</h2>
        <Link to="/blog" className="text-sm font-medium text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
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
    </section>
  );
}

export default function Home() {
  const { h1, p, seo_title, seo_description } = usePageContent('home', {
    h1: 'Find your dream tour and hit the road',
    p: 'Explore our carefully curated package tours, daily tours and activities. Detailed itineraries, transparent pricing and easy communication.',
  });
  useSeo(seo_title || h1, seo_description || p);

  const [tours, setTours] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/tours'), api.get('/blog')])
      .then(([toursRes, blog]) => {
        if (!active) return;
        setTours(toursRes.data);
        setBlogPosts(blog.data);
      })
      .catch(() => {
        if (active) setError('Something went wrong while loading tours.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const nothingPublished = !loading && !error && tours.length === 0;

  return (
    <div>
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-200">
            Unforgettable Journeys
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{h1}</h1>
          <p className="mx-auto mt-4 max-w-xl text-teal-100">{p}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/tours/package"
              className="btn-primary bg-amber-500 hover:bg-amber-600"
            >
              Explore Package Tours
            </Link>
            <Link
              to="/tours/daily"
              className="btn-secondary !bg-white/10 !text-white hover:!bg-white/20"
            >
              Explore Daily Tours
            </Link>
          </div>
        </div>
      </section>

      {loading && <p className="mx-auto max-w-6xl px-4 py-10 text-gray-500 sm:px-6">Loading...</p>}
      {error && <p className="mx-auto max-w-6xl px-4 py-10 text-red-600 sm:px-6">{error}</p>}
      {nothingPublished && (
        <p className="mx-auto max-w-6xl px-4 py-10 text-gray-500 sm:px-6">
          Nothing published yet. Check back soon!
        </p>
      )}

      {TOUR_TYPES.map((type) => (
        <TypeSection key={type.value} type={type} items={tours.filter((t) => t.type === type.value)} />
      ))}
      <BlogSection posts={blogPosts} />
    </div>
  );
}
