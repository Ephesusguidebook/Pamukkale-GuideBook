import { useEffect } from 'react';

const SITE_NAME = 'TurRota';

// Sets document.title and the <meta name="description"> tag for the
// current page. Falls back sensibly if either value is empty, and always
// appends the site name to the title so tabs/search results stay branded.
export default function useSeo(title, description) {
  useEffect(() => {
    const finalTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = finalTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [title, description]);
}
