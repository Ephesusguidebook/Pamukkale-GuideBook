import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

// Pings the server on every in-app route change (mounted once, inside the
// public layout only) so Admin > Traffic can report how many pages real
// visitors browse per session. Bots almost never run this JS, so it stays
// focused on human sessions; the server also double-checks the User-Agent
// and silently drops anything that looks like a bot.
export default function PageviewTracker() {
  const location = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;
    api.post('/track/pageview', { path, referrer: document.referrer || '' }).catch(() => {});
  }, [location.pathname]);

  return null;
}
