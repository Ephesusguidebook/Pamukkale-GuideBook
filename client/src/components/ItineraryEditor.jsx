export default function ItineraryEditor({ days, onChange }) {
  function updateDay(idx, field, value) {
    const next = days.map((d, i) => (i === idx ? { ...d, [field]: value } : d));
    onChange(next);
  }

  function addDay() {
    const nextNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number || 0)) + 1 : 1;
    onChange([...days, { day_number: nextNumber, title: '', details: '' }]);
  }

  function removeDay(idx) {
    onChange(days.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {days.map((day, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="w-20">
              <label className="label">Gün</label>
              <input
                type="number"
                min={1}
                className="input"
                value={day.day_number}
                onChange={(e) => updateDay(idx, 'day_number', Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="label">Başlık</label>
              <input
                className="input"
                placeholder="Örn: Varış ve Şehir Turu"
                value={day.title}
                onChange={(e) => updateDay(idx, 'title', e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeDay(idx)}
              className="btn-danger !px-3 !py-2 self-end text-xs"
            >
              Kaldır
            </button>
          </div>
          <div className="mt-2">
            <label className="label">Detaylar</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Bu güne ait program detaylarını yazın..."
              value={day.details}
              onChange={(e) => updateDay(idx, 'details', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addDay} className="btn-secondary">
        + Gün Ekle
      </button>
    </div>
  );
}
