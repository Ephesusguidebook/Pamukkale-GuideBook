import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const PageContentContext = createContext(null);

// Fetches the editable H1/paragraph copy for every page once, and shares it
// across the whole public site so each page doesn't need its own request.
export function PageContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/page-content')
      .then((res) => {
        if (active) setContent(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContentContext.Provider value={{ content, loading }}>
      {children}
    </PageContentContext.Provider>
  );
}

// Returns { h1, p } for the given page key. Falls back to the provided
// defaults until the fetch resolves (or if the admin never customized it).
export function usePageContent(key, fallback) {
  const ctx = useContext(PageContentContext);
  const fromServer = ctx?.content?.[key];
  return fromServer || fallback || { h1: '', p: '' };
}
