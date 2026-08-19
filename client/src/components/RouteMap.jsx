import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet'in varsayılan marker ikonları Vite build'inde bozulabiliyor,
// bu yüzden basit, kendi çizdiğimiz numaralı dairesel ikonları kullanıyoruz.
function numberedIcon(number, isLast) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${isLast ? '#f59e0b' : '#0f766e'};
      color:#fff;
      width:28px;height:28px;
      border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function RouteMap({ points }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap katkıda bulunanlar',
      maxZoom: 18,
    }).addTo(map);

    const latLngs = points.map((p) => [p.lat, p.lng]);

    points.forEach((p, idx) => {
      L.marker([p.lat, p.lng], { icon: numberedIcon(idx + 1, idx === points.length - 1) })
        .addTo(map)
        .bindPopup(`<strong>${idx + 1}. ${p.name}</strong>`);
    });

    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: '#0f766e',
        weight: 3,
        dashArray: '6 8',
      }).addTo(map);
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 6);
    } else {
      map.fitBounds(latLngs, { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (!points || points.length === 0) return null;

  return (
    <div>
      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-2xl border border-gray-100" />
      <ol className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
        {points.map((p, idx) => (
          <li key={p.id || idx} className="flex items-center gap-1">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                idx === points.length - 1 ? 'bg-amber-500' : 'bg-teal-700'
              }`}
            >
              {idx + 1}
            </span>
            {p.name}
            {idx < points.length - 1 && <span className="ml-1 text-gray-300">→</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
