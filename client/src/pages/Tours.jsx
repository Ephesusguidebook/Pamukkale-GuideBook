import { Link, useParams } from 'react-router-dom';
import TourListing from './TourListing';
import TourDetail from './TourDetail';
import { classifySegment } from '../lib/tourRouting';

function InvalidToursPath() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500">This combination of filters doesn't exist.</p>
      <Link to="/tours" className="btn-primary mt-6 inline-flex">
        Back to Tours
      </Link>
    </div>
  );
}

// Single router mounted at /tours, /tours/:seg1 and /tours/:seg1/:seg2.
// Each raw URL segment is classified as a type filter (daily/activities/
// package), a departure filter (from-kusadasi), or — if it's a single
// segment matching neither — a candidate tour detail slug. This mirrors the
// server-side classification in server/index.js so the 404 status Google
// sees matches what actually renders.
export default function Tours() {
  const { seg1, seg2 } = useParams();
  const segments = [seg1, seg2].filter(Boolean);

  if (segments.length === 0) {
    return <TourListing />;
  }

  if (segments.length === 1) {
    const cls = classifySegment(segments[0]);
    if (!cls) {
      return <TourDetail slug={segments[0]} />;
    }
    return (
      <TourListing
        typeFilter={cls.kind === 'type' ? cls.value : undefined}
        departureFilter={cls.kind === 'departure' ? cls.value : undefined}
      />
    );
  }

  // Two segments: only valid as a combined type + departure filter (in
  // either order) — there's no nested detail route.
  const c1 = classifySegment(segments[0]);
  const c2 = classifySegment(segments[1]);
  if (c1 && c2 && c1.kind !== c2.kind) {
    const type = [c1, c2].find((c) => c.kind === 'type');
    const departure = [c1, c2].find((c) => c.kind === 'departure');
    return <TourListing typeFilter={type?.value} departureFilter={departure?.value} />;
  }

  return <InvalidToursPath />;
}
