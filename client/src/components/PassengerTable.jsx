import { useState } from 'react';

const EMPTY_PASSENGER = {
  full_name: '',
  nationality: '',
  passport_number: '',
  date_of_birth: '',
  passport_expiry: '',
  notes: '',
};

// Passenger / passport registry for one booking — shared between the
// Agency portal (its own bookings) and Admin > Agencies (oversight of
// every agency's bookings). Purely presentational: the caller supplies the
// current passenger list and the three async callbacks that actually talk
// to the right API (agency-scoped vs admin-scoped endpoints).
export default function PassengerTable({ passengers, onAdd, onUpdate, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PASSENGER);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY_PASSENGER);
  const [busy, setBusy] = useState(false);

  function startEdit(p) {
    setEditingId(p.id);
    setEditDraft({
      full_name: p.full_name || '',
      nationality: p.nationality || '',
      passport_number: p.passport_number || '',
      date_of_birth: p.date_of_birth || '',
      passport_expiry: p.passport_expiry || '',
      notes: p.notes || '',
    });
  }

  async function submitAdd() {
    if (!draft.full_name.trim()) return;
    setBusy(true);
    try {
      await onAdd(draft);
      setDraft(EMPTY_PASSENGER);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    setBusy(true);
    try {
      await onUpdate(editingId, editDraft);
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = 'input !py-1 text-sm';

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Full Name</th>
              <th className="px-3 py-2">Nationality</th>
              <th className="px-3 py-2">Passport #</th>
              <th className="px-3 py-2">Date of Birth</th>
              <th className="px-3 py-2">Passport Expiry</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {passengers.length === 0 && !adding && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                  No passengers registered yet.
                </td>
              </tr>
            )}
            {passengers.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="bg-blue-50/40">
                  <td className="px-3 py-2">
                    <input className={fieldClass} value={editDraft.full_name} onChange={(e) => setEditDraft((d) => ({ ...d, full_name: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={fieldClass} value={editDraft.nationality} onChange={(e) => setEditDraft((d) => ({ ...d, nationality: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={fieldClass} value={editDraft.passport_number} onChange={(e) => setEditDraft((d) => ({ ...d, passport_number: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="date" className={fieldClass} value={editDraft.date_of_birth} onChange={(e) => setEditDraft((d) => ({ ...d, date_of_birth: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="date" className={fieldClass} value={editDraft.passport_expiry} onChange={(e) => setEditDraft((d) => ({ ...d, passport_expiry: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={fieldClass} value={editDraft.notes} onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" disabled={busy} onClick={submitEdit} className="mr-2 text-xs font-medium text-blue-700 hover:underline">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-500 hover:underline">
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.full_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{p.nationality || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{p.passport_number || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{p.date_of_birth || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{p.passport_expiry || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{p.notes || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" onClick={() => startEdit(p)} className="mr-2 text-xs font-medium text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => onRemove(p.id)} className="text-xs font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              )
            )}
            {adding && (
              <tr className="bg-emerald-50/40">
                <td className="px-3 py-2">
                  <input className={fieldClass} placeholder="Full name" value={draft.full_name} onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))} />
                </td>
                <td className="px-3 py-2">
                  <input className={fieldClass} placeholder="Nationality" value={draft.nationality} onChange={(e) => setDraft((d) => ({ ...d, nationality: e.target.value }))} />
                </td>
                <td className="px-3 py-2">
                  <input className={fieldClass} placeholder="Passport #" value={draft.passport_number} onChange={(e) => setDraft((d) => ({ ...d, passport_number: e.target.value }))} />
                </td>
                <td className="px-3 py-2">
                  <input type="date" className={fieldClass} value={draft.date_of_birth} onChange={(e) => setDraft((d) => ({ ...d, date_of_birth: e.target.value }))} />
                </td>
                <td className="px-3 py-2">
                  <input type="date" className={fieldClass} value={draft.passport_expiry} onChange={(e) => setDraft((d) => ({ ...d, passport_expiry: e.target.value }))} />
                </td>
                <td className="px-3 py-2">
                  <input className={fieldClass} placeholder="Notes" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <button type="button" disabled={busy} onClick={submitAdd} className="mr-2 text-xs font-medium text-emerald-700 hover:underline">
                    Add
                  </button>
                  <button type="button" onClick={() => { setAdding(false); setDraft(EMPTY_PASSENGER); }} className="text-xs font-medium text-gray-500 hover:underline">
                    Cancel
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!adding && (
        <button type="button" onClick={() => setAdding(true)} className="btn-secondary mt-3 !px-3 !py-1.5 text-xs">
          + Add Passenger
        </button>
      )}
    </div>
  );
}
