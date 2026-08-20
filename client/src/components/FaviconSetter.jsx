import { useEffect, useState } from 'react';
import api from '../api';

// Applies the admin-configured favicon (from Settings > Branding, chosen
// via the Media Library) to the page once settings load. Renders nothing.
export default function FaviconSetter() {
  const [favicon, setFavicon] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setFavicon(res.data.site_favicon || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!favicon) return;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [favicon]);

  return null;
}
