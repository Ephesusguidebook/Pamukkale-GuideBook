import { useEffect, useState } from 'react';
import api from '../api';

export default function ConsultantCard() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setSettings(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!settings || !settings.consultant_name) return null;

  const waLink = settings.consultant_whatsapp
    ? `https://wa.me/${settings.consultant_whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-semibold text-gray-500">Travel Consultant</p>
      <div className="flex items-center gap-3">
        {settings.consultant_photo ? (
          <img
            src={settings.consultant_photo}
            alt={settings.consultant_name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
            {settings.consultant_name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{settings.consultant_name}</p>
          {settings.consultant_title && (
            <p className="text-xs text-gray-500">{settings.consultant_title}</p>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm text-gray-600">
        {settings.consultant_phone && <p>📞 {settings.consultant_phone}</p>}
        {settings.consultant_email && <p>✉️ {settings.consultant_email}</p>}
      </div>
      <div className="mt-4 flex gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex-1 !py-2 text-xs"
          >
            WhatsApp
          </a>
        )}
        {settings.consultant_email && (
          <a
            href={`mailto:${settings.consultant_email}`}
            className="btn-primary flex-1 !py-2 text-xs"
          >
            Email
          </a>
        )}
      </div>
    </div>
  );
}
