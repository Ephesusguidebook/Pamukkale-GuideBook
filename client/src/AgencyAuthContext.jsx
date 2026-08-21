import { createContext, useContext, useEffect, useState } from 'react';
import agencyApi from './agencyApi';

const AgencyAuthContext = createContext(null);

export function AgencyAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('agency_token'));
  const [agency, setAgency] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    agencyApi
      .get('/agency/auth/me')
      .then((res) => setAgency(res.data))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('agency_token');
      })
      .finally(() => setChecking(false));
  }, [token]);

  async function login(email, password) {
    const res = await agencyApi.post('/agency/auth/login', { email, password });
    localStorage.setItem('agency_token', res.data.token);
    setToken(res.data.token);
    setAgency({ email: res.data.email, company_name: res.data.company_name });
  }

  function logout() {
    localStorage.removeItem('agency_token');
    setToken(null);
    setAgency(null);
  }

  async function refresh() {
    const res = await agencyApi.get('/agency/auth/me');
    setAgency(res.data);
    return res.data;
  }

  return (
    <AgencyAuthContext.Provider
      value={{ token, agency, checking, isAuthenticated: !!token, login, logout, refresh }}
    >
      {children}
    </AgencyAuthContext.Provider>
  );
}

export function useAgencyAuth() {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error('useAgencyAuth must be used inside AgencyAuthProvider.');
  return ctx;
}
