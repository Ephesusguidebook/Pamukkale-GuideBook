import { useEffect, useState } from 'react';
import api from '../api';

// Floating WhatsApp button shown on every public page. Hidden until the
// admin sets a phone number in Settings > WhatsApp Button.
export default function WhatsAppButton() {
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setPhone(res.data.whatsapp_button_phone || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!phone) return null;

  const waLink = `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.674 4.523 1.84 6.364L4 29l7.82-1.805A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.98 16.86c-.29.816-1.44 1.5-2.36 1.7-.63.13-1.45.24-4.22-.9-3.54-1.47-5.82-5.05-6-5.29-.17-.24-1.43-1.9-1.43-3.63 0-1.72.9-2.57 1.22-2.92.29-.32.63-.4.84-.4.21 0 .42.003.6.012.19.01.45-.07.7.54.29.7.98 2.42 1.06 2.6.08.18.14.39.03.63-.11.24-.16.39-.32.6-.16.2-.34.46-.48.62-.16.18-.33.37-.14.7.19.32.85 1.4 1.83 2.27 1.26 1.12 2.31 1.47 2.65 1.63.34.16.53.14.73-.08.2-.22.85-.99 1.08-1.33.23-.34.45-.28.76-.17.31.12 1.98.93 2.32 1.1.34.17.56.25.64.4.08.15.08.85-.21 1.67Z" />
      </svg>
    </a>
  );
}
