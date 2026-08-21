import { useState } from 'react';

// Shared month calendar for Faz 6 (Transfer Routes) availability, built so
// it can be reused for Tours later without changes — it only ever talks in
// plain 'YYYY-MM-DD' date strings and a status map, nothing route-specific.
//
// mode="admin": clicking a date cycles Available -> On Request -> Closed ->
// Available and calls onStatusChange(dateStr, nextStatus). The caller is
// responsible for persisting it (and updating availabilityMap).
//
// mode="public": clicking a date (if not Closed and not in the past) calls
// onSelectDate(dateStr) — the caller uses it to drive the booking widget.
// selectedDate highlights the current pick.

const STATUS_CYCLE = ['available', 'on_request', 'closed'];
const STATUS_LABEL = { available: 'Available', on_request: 'On Request', closed: 'Closed' };
const STATUS_DOT_CLASS = {
  available: 'bg-emerald-500',
  on_request: 'bg-amber-500',
  closed: 'bg-rose-500',
};

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function AvailabilityCalendar({
  availabilityMap = {},
  mode = 'public',
  onStatusChange,
  onSelectDate,
  selectedDate,
  disablePast = true,
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first weekday index (0=Mon .. 6=Sun), matching the reference design.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  function prevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }
  function nextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function handleClick(dateStr, isPast) {
    if (isPast) return;
    if (mode === 'admin') {
      const current = availabilityMap[dateStr] || 'available';
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
      onStatusChange && onStatusChange(dateStr, next);
    } else {
      const status = availabilityMap[dateStr] || 'available';
      if (status === 'closed') return;
      onSelectDate && onSelectDate(dateStr);
    }
  }

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100">
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-800">
          {firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button type="button" onClick={nextMonth} className="rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
          <div key={d} className="py-1 font-medium text-gray-400">
            {d}
          </div>
        ))}
        {cells.map((d, idx) => {
          if (d === null) return <div key={`b${idx}`} />;
          const dateStr = toDateStr(viewYear, viewMonth, d);
          const isPast = disablePast && dateStr < todayStr;
          const status = availabilityMap[dateStr] || 'available';
          const isSelected = selectedDate === dateStr;
          const clickable = !isPast && (mode === 'admin' || status !== 'closed');
          return (
            <button
              type="button"
              key={dateStr}
              disabled={!clickable}
              onClick={() => handleClick(dateStr, isPast)}
              title={STATUS_LABEL[status]}
              className={`relative rounded-lg py-1.5 text-sm transition ${
                isPast
                  ? 'cursor-not-allowed text-gray-300'
                  : isSelected
                  ? 'bg-blue-700 font-semibold text-white'
                  : status === 'available'
                  ? 'bg-emerald-50 text-gray-800 hover:bg-emerald-100'
                  : status === 'on_request'
                  ? 'bg-amber-50 text-gray-800 hover:bg-amber-100'
                  : 'bg-rose-50 text-gray-400'
              }`}
            >
              {d}
              {!isPast && (
                <span
                  className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? 'bg-white' : STATUS_DOT_CLASS[status]
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        {STATUS_CYCLE.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[s]}`} /> {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
      {mode === 'admin' && (
        <p className="mt-2 text-xs text-gray-500">Bir tarihe tıklayarak durumunu değiştirin (Available → On Request → Closed).</p>
      )}
    </div>
  );
}
