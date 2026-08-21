import { useEffect, useState } from 'react';
import agencyApi from '../../agencyApi';
import PassengerTable from '../../components/PassengerTable';

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${amount} ${currency || ''}`;
  }
}

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function AgencyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function loadBookings() {
    setLoading(true);
    agencyApi
      .get('/agency/bookings')
      .then((res) => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(loadBookings, []);

  function openBooking(id) {
    setSelectedId(id);
    setDetailLoading(true);
    agencyApi
      .get(`/agency/bookings/${id}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }

  async function addPassenger(input) {
    await agencyApi.post(`/agency/bookings/${selectedId}/passengers`, input);
    openBooking(selectedId);
    loadBookings();
  }
  async function updatePassenger(id, input) {
    await agencyApi.put(`/agency/bookings/${selectedId}/passengers/${id}`, input);
    openBooking(selectedId);
  }
  async function removePassenger(id) {
    if (!window.confirm('Remove this passenger?')) return;
    await agencyApi.delete(`/agency/bookings/${selectedId}/passengers/${id}`);
    openBooking(selectedId);
    loadBookings();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Bookings</h1>

      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && bookings.length === 0 && (
        <p className="text-gray-500">No booking requests yet — request one from the Tours list.</p>
      )}

      {!loading && bookings.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Travel Date</th>
                <th className="px-4 py-3">Pax</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Passengers</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className={selectedId === b.id ? 'bg-blue-50/40' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.tour_title}</td>
                  <td className="px-4 py-3 text-gray-600">{b.travel_date || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.pax_count}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{formatPrice(b.total_price, b.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] || ''}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.passenger_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openBooking(b.id)}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      {selectedId === b.id ? 'Selected' : 'Manage Passengers'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && (
        <div className="card mt-6 p-5">
          {detailLoading && <p className="text-gray-500">Loading booking...</p>}
          {!detailLoading && detail && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{detail.tour_title}</h2>
                  <p className="text-sm text-gray-500">
                    {detail.travel_date || 'Date TBC'} · {detail.pax_count} pax ·{' '}
                    {formatPrice(detail.total_price, detail.currency)}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="btn-secondary !px-3 !py-1.5 text-xs">
                  Close
                </button>
              </div>
              {detail.notes && (
                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Notes: {detail.notes}</p>
              )}
              <h3 className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Passenger / Passport Registry
              </h3>
              <PassengerTable
                passengers={detail.passengers || []}
                onAdd={addPassenger}
                onUpdate={updatePassenger}
                onRemove={removePassenger}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
