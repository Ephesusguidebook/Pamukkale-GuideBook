import { useEffect } from 'react';

// Injects (and cleans up) a <script type="application/ld+json"> tag in
// <head> for SEO structured data — no extra dependency (e.g. react-helmet)
// needed for this single use case.
export default function useJsonLd(data) {
  useEffect(() => {
    if (!data) return undefined;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [JSON.stringify(data)]);
}
