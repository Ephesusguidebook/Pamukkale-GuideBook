import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import PassengerTable from '../../components/PassengerTable';

const emptyAgency = {
  company_name: '',
  contact_name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  markup_percent: '',
  status: 'active',
  notes: '',
};

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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminAgencyForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(emptyAgency);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api
      .get(`/admin/agencies/${id}`)
      .then((res) => setForm({ ...emptyAgency, ...res.data, password: '' }))
      .catch(() => setError('Could not load this agency.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError('A password is required to create a new agency login.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, markup_percent: form.markup_percent === '' ? null : form.markup_percent };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        const res = await api.put(`/admin/agencies/${id}`, payload);
        setForm({ ...emptyAgency, ...res.data, password: '' });
      } else {
        const res = await api.post('/admin/agencies', payload);
        navigate(`/admin/agencies/${res.data.id}`, { replace: true });
        return;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? form.company_name || form.email : 'Add Agency'}
      </h1>

      {isEdit && (
        <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200 pb-2">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
            Profile
          </TabButton>
          <TabButton active={tab === 'bookings'} onClick={() => setTab('bookings')}>
            Bookings
          </TabButton>
          <TabButton active={tab === 'ledger'} onClick={() => setTab('ledger')}>
            Ön Muhasebe
          </TabButton>
        </div>
      )}

      {(!isEdit || tab === 'profile') && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email (login)</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="label">{isEdit ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <input
                type="password"
                className="input"
                required={!isEdit}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Agency Markup % Override (blank = use site-wide rate)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="e.g. 8"
                value={form.markup_percent ?? ''}
                onChange={(e) => update('markup_percent', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended (login blocked)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Admin Notes (not visible to the agency)</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Agency'}
          </button>
        </form>
      )}

      {isEdit && tab === 'bookings' && <AgencyBookingsPanel agencyId={id} />}
      {isEdit && tab === 'ledger' && <AgencyLedgerPanel agencyId={id} />}
    </div>
  );
}

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function AgencyBookingsPanel({ agencyId }) {
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newBooking, setNewBooking] = useState({
    tour_id: '',
    travel_date: '',
    pax_count: 1,
    total_price: '',
    currency: 'EUR',
    status: 'pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  function loadBookings() {
    setLoading(true);
    api
      .get(`/admin/agencies/${agencyId}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
    api
      .get('/tours')
      .then((res) => setTours(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  function openBooking(bookingId) {
    setSelectedId(bookingId);
    setAddingNew(false);
    api
      .get(`/admin/agencies/${agencyId}/bookings/${bookingId}`)
      .then((res) => {
        setDetail(res.data);
        setEditDraft({
          travel_date: res.data.travel_date || '',
          pax_count: res.data.pax_count,
          total_price: res.data.total_price,
          currency: res.data.currency,
          status: res.data.status,
          admin_notes: res.data.admin_notes || '',
        });
      })
      .catch(() => setDetail(null));
  }

  async function saveBooking(addLedgerCharge) {
    setSaving(true);
    try {
      await api.put(`/admin/agencies/${agencyId}/bookings/${selectedId}`, {
        ...editDraft,
        add_ledger_charge: addLedgerCharge,
      });
      openBooking(selectedId);
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not save this booking.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking() {
    if (!window.confirm('Delete this booking? Its passengers and any linked ledger charge will be removed too.')) return;
    await api.delete(`/admin/agencies/${agencyId}/bookings/${selectedId}`);
    setSelectedId(null);
    setDetail(null);
    loadBookings();
  }

  async function createBooking(e) {
    e.preventDefault();
    const tour = tours.find((t) => String(t.id) === String(newBooking.tour_id));
    setSaving(true);
    try {
      await api.post(`/admin/agencies/${agencyId}/bookings`, {
        ...newBooking,
        tour_title: tour ? tour.title : '',
        total_price: Number(newBooking.total_price) || 0,
      });
      setAddingNew(false);
      setNewBooking({ tour_id: '', travel_date: '', pax_count: 1, total_price: '', currency: 'EUR', status: 'pending', notes: '' });
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create this booking.');
    } finally {
      setSaving(false);
    }
  }

  async function addPassenger(input) {
    await api.post(`/admin/agencies/${agencyId}/bookings/${selectedId}/passengers`, input);
    openBooking(selectedId);
  }
  async function updatePassenger(pid, input) {
    await api.put(`/admin/agencies/${agencyId}/bookings/${selectedId}/passengers/${pid}`, input);
    openBooking(selectedId);
  }
  async function removePassenger(pid) {
    if (!window.confirm('Remove this passenger?')) return;
    await api.delete(`/admin/agencies/${agencyId}/bookings/${selectedId}/passengers/${pid}`);
    openBooking(selectedId);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Booking Requests</h2>
        <button type="button" onClick={() => { setAddingNew((v) => !v); setSelectedId(null); }} className="btn-secondary !px-3 !py-1.5 text-xs">
          {addingNew ? 'Cancel' : '+ Log a Booking'}
        </button>
      </div>

      {addingNew && (
        <form onSubmit={createBooking} className="card mb-4 space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Tour</label>
              <select
                className="input"
                required
                value={newBooking.tour_id}
                onChange={(e) => setNewBooking((b) => ({ ...b, tour_id: e.target.value }))}
              >
                <option value="">Select a tour...</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Travel Date</label>
              <input type="date" className="input" value={newBooking.travel_date} onChange={(e) => setNewBooking((b) => ({ ...b, travel_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Pax</label>
              <input type="number" min="1" className="input" value={newBooking.pax_count} onChange={(e) => setNewBooking((b) => ({ ...b, pax_count: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Price</label>
              <input type="number" step="0.01" className="input" value={newBooking.total_price} onChange={(e) => setNewBooking((b) => ({ ...b, total_price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Currency</label>
              <input className="input" value={newBooking.currency} onChange={(e) => setNewBooking((b) => ({ ...b, currency: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={newBooking.notes} onChange={(e) => setNewBooking((b) => ({ ...b, notes: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create Booking'}
          </button>
        </form>
      )}

      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && bookings.length === 0 && !addingNew && <p className="text-gray-500">No bookings yet.</p>}

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
                <tr key={b.id} className={selectedId === b.id ? 'bg-teal-50/40' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.tour_title}</td>
                  <td className="px-4 py-3 text-gray-600">{b.travel_date || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.pax_count}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700">{formatPrice(b.total_price, b.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.passenger_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openBooking(b.id)} className="text-xs font-medium text-teal-700 hover:underline">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && detail && editDraft && (
        <div className="card mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-900">{detail.tour_title}</h3>
            <div className="flex gap-2">
              <button type="button" onClick={deleteBooking} className="btn-danger !px-3 !py-1.5 text-xs">
                Delete
              </button>
              <button type="button" onClick={() => setSelectedId(null)} className="btn-secondary !px-3 !py-1.5 text-xs">
                Close
              </button>
            </div>
          </div>
          {detail.notes && <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Agency notes: {detail.notes}</p>}

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Travel Date</label>
              <input type="date" className="input" value={editDraft.travel_date} onChange={(e) => setEditDraft((d) => ({ ...d, travel_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Pax</label>
              <input type="number" min="1" className="input" value={editDraft.pax_count} onChange={(e) => setEditDraft((d) => ({ ...d, pax_count: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Price</label>
              <input type="number" step="0.01" className="input" value={editDraft.total_price} onChange={(e) => setEditDraft((d) => ({ ...d, total_price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={editDraft.status} onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Admin Notes (not visible to the agency)</label>
            <textarea className="input" rows={2} value={editDraft.admin_notes} onChange={(e) => setEditDraft((d) => ({ ...d, admin_notes: e.target.value }))} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={() => saveBooking(false)} className="btn-secondary">
              Save
            </button>
            <button type="button" disabled={saving} onClick={() => saveBooking(true)} className="btn-primary">
              Save &amp; Add Charge to Ledger
            </button>
          </div>

          <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Passenger / Passport Registry
          </h4>
          <PassengerTable
            passengers={detail.passengers || []}
            onAdd={addPassenger}
            onUpdate={updatePassenger}
            onRemove={removePassenger}
          />
        </div>
      )}
    </div>
  );
}

function AgencyLedgerPanel({ agencyId }) {
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ entry_date: new Date().toISOString().slice(0, 10), type: 'payment', description: '', amount: '', currency: 'EUR' });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get(`/admin/agencies/${agencyId}/ledger`)
      .then((res) => {
        setEntries(res.data.entries);
        setBalance(res.data.balance);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [agencyId]);

  async function addEntry(e) {
    e.preventDefault();
    if (!draft.amount) return;
    setSaving(true);
    try {
      await api.post(`/admin/agencies/${agencyId}/ledger`, draft);
      setDraft((d) => ({ ...d, description: '', amount: '' }));
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add this entry.');
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entryId) {
    if (!window.confirm('Remove this ledger entry?')) return;
    await api.delete(`/admin/agencies/${agencyId}/ledger/${entryId}`);
    load();
  }

  return (
    <div>
      <div className="card mb-6 flex items-center justify-between p-5">
        <span className="font-semibold text-gray-700">Current Balance</span>
        <span className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatPrice(Math.abs(balance), entries[0]?.currency || 'EUR')}
          <span className="ml-2 text-sm font-medium text-gray-400">{balance > 0 ? 'owed by agency' : balance < 0 ? 'credit' : ''}</span>
        </span>
      </div>

      <form onSubmit={addEntry} className="card mb-6 space-y-3 p-4">
        <h3 className="font-semibold text-gray-900">Add Entry</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={draft.entry_date} onChange={(e) => setDraft((d) => ({ ...d, entry_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
              <option value="charge">Charge (agency owes)</option>
              <option value="payment">Payment (agency paid)</option>
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" className="input" required value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="e.g. Bank transfer payment" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add Entry'}
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && entries.length === 0 && <p className="text-gray-500">No statement entries yet.</p>}

      {!loading && entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-600">{e.entry_date}</td>
                  <td className="px-4 py-3 text-gray-800">{e.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.type === 'payment' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {e.type === 'payment' ? 'Payment' : 'Charge'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${e.type === 'payment' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {e.type === 'payment' ? '− ' : ''}
                    {formatPrice(e.amount, e.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => removeEntry(e.id)} className="text-xs font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
