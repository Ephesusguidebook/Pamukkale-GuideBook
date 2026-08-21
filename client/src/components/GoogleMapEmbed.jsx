// Live location embed sourced from Google Maps — uses the no-API-key
// "output=embed" query form (https://maps.google.com/maps?q=lat,lng&...) so
// this works out of the box without a billing-enabled Google Cloud project.
export default function GoogleMapEmbed({ lat, lng, title }) {
  if (lat == null || lng == null) return null;
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <iframe
        title={title ? `Map: ${title}` : 'Map'}
        src={src}
        width="100%"
        height="320"
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
