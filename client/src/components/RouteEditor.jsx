export default function RouteEditor({ points, onChange }) {
  function updatePoint(idx, field, value) {
    const next = points.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    onChange(next);
  }

  function addPoint() {
    onChange([...points, { name: '', lat: '', lng: '' }]);
  }

  function removePoint(idx) {
    onChange(points.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Haritada gösterilecek duraklar. Enlem/boylam (lat/lng) değerlerini Google
        Maps'te bir yere sağ tıklayıp koordinatları kopyalayarak bulabilirsin. En az
        2 durak eklersen harita ve rota çizgisi görünür.
      </p>
      {points.map((point, idx) => (
        <div key={idx} className="flex items-end gap-2 rounded-lg border border-gray-200 p-3">
          <div className="flex-1">
            <label className="label">Durak adı</label>
            <input
              className="input"
              placeholder="Örn: İstanbul"
              value={point.name}
              onChange={(e) => updatePoint(idx, 'name', e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="label">Enlem (lat)</label>
            <input
              className="input"
              placeholder="41.0082"
              value={point.lat}
              onChange={(e) => updatePoint(idx, 'lat', e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="label">Boylam (lng)</label>
            <input
              className="input"
              placeholder="28.9784"
              value={point.lng}
              onChange={(e) => updatePoint(idx, 'lng', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => removePoint(idx)}
            className="btn-danger !px-3 !py-2 text-xs"
          >
            Kaldır
          </button>
        </div>
      ))}
      <button type="button" onClick={addPoint} className="btn-secondary">
        + Durak Ekle
      </button>
    </div>
  );
}
