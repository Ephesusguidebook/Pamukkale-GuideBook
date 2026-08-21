import { useEffect, useState } from 'react';
import agencyApi from '../../agencyApi';

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

// "Ön Muhasebe" — a read-only running current account (cari hesap): every
// charge (a confirmed booking) and payment we've recorded for this agency,
// oldest last, with the running balance shown up top. The agency can only
// read this — entries are managed from Admin > Agencies.
export default function AgencyLedger() {
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agencyApi
      .get('/agency/ledger')
      .then((res) => {
        setEntries(res.data.entries);
        setBalance(res.data.balance);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Ön Muhasebe</h1>
      <p className="mb-6 text-sm text-gray-500">Your account statement — charges and payments we've recorded.</p>

      <div className="card mb-6 flex items-center justify-between p-5">
        <span className="font-semibold text-gray-700">Current Balance</span>
        <span className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatPrice(Math.abs(balance), entries[0]?.currency || 'EUR')}
          <span className="ml-2 text-sm font-medium text-gray-400">{balance > 0 ? 'owed' : balance < 0 ? 'credit' : ''}</span>
        </span>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-600">{e.entry_date}</td>
                  <td className="px-4 py-3 text-gray-800">{e.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.type === 'payment' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {e.type === 'payment' ? 'Payment' : 'Charge'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${e.type === 'payment' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {e.type === 'payment' ? '− ' : ''}
                    {formatPrice(e.amount, e.currency)}
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
