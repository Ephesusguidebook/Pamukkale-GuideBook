import { useEffect, useState } from 'react';
import api from '../api';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.674 4.523 1.84 6.364L4 29l7.82-1.805A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.98 16.86c-.29.816-1.44 1.5-2.36 1.7-.63.13-1.45.24-4.22-.9-3.54-1.47-5.82-5.05-6-5.29-.17-.24-1.43-1.9-1.43-3.63 0-1.72.9-2.57 1.22-2.92.29-.32.63-.4.84-.4.21 0 .42.003.6.012.19.01.45-.07.7.54.29.7.98 2.42 1.06 2.6.08.18.14.39.03.63-.11.24-.16.39-.32.6-.16.2-.34.46-.48.62-.16.18-.33.37-.14.7.19.32.85 1.4 1.83 2.27 1.26 1.12 2.31 1.47 2.65 1.63.34.16.53.14.73-.08.2-.22.85-.99 1.08-1.33.23-.34.45-.28.76-.17.31.12 1.98.93 2.32 1.1.34.17.56.25.64.4.08.15.08.85-.21 1.67Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36C16.24 4.32 15.36 4.25 14.34 4.25c-2.13 0-3.59 1.3-3.59 3.68V10.5H8.25v3h2.5V21h2.75Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 2.2c2.72 0 3.05.01 4.12.06 1.07.05 1.79.22 2.43.47.66.25 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.36.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.05-.06 4.12c-.05 1.07-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.36.42-2.43.47-1.07.05-1.4.06-4.12.06s-3.05-.01-4.12-.06c-1.07-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.36-.47-2.43C2.01 15.05 2 14.72 2 12s.01-3.05.06-4.12c.05-1.07.22-1.79.47-2.43a4.9 4.9 0 0 1 1.15-1.77A4.9 4.9 0 0 1 5.45 2.53c.64-.25 1.36-.42 2.43-.47C8.95 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.66.3-.42.16-.72.36-1.03.67-.31.31-.51.61-.67 1.03-.12.32-.26.79-.3 1.66-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.87.18 1.34.3 1.66.16.42.36.72.67 1.03.31.31.61.51 1.03.67.32.12.79.26 1.66.3 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.87-.04 1.34-.18 1.66-.3.42-.16.72-.36 1.03-.67.31-.31.51-.61.67-1.03.12-.32.26-.79.3-1.66.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.87-.18-1.34-.3-1.66a2.77 2.77 0 0 0-.67-1.03 2.77 2.77 0 0 0-1.03-.67c-.32-.12-.79-.26-1.66-.3-1.05-.05-1.37-.06-4.04-.06Zm0 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.1-2.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0Z" />
    </svg>
  );
}

// Renders whichever WhatsApp / Facebook / Instagram links the admin has set
// in Settings — each icon is only shown once its field is filled in.
export default function SocialLinks({ className = '' }) {
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

  if (!settings) return null;

  const links = [
    settings.whatsapp_button_phone && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${settings.whatsapp_button_phone.replace(/\D/g, '')}`,
      icon: <WhatsAppIcon />,
      colors: 'bg-[#25D366] hover:bg-[#1ebe5a]',
    },
    settings.facebook_url && {
      key: 'facebook',
      label: 'Facebook',
      href: settings.facebook_url,
      icon: <FacebookIcon />,
      colors: 'bg-[#1877F2] hover:bg-[#1461c9]',
    },
    settings.instagram_url && {
      key: 'instagram',
      label: 'Instagram',
      href: settings.instagram_url,
      icon: <InstagramIcon />,
      colors: 'bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] hover:opacity-90',
    },
  ].filter(Boolean);

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition ${link.colors}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
