import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [email, setEmail] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setEmail(res.data.email))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('admin_token');
      })
      .finally(() => setChecking(false));
  }, [token]);

  async function login(loginEmail, password) {
    const res = await api.post('/auth/login', { email: loginEmail, password });
    localStorage.setItem('admin_token', res.data.token);
    setToken(res.data.token);
    setEmail(res.data.email);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    setToken(null);
    setEmail(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{ token, email, checking, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth, AdminAuthProvider içinde kullanılmalı.');
  return ctx;
}
