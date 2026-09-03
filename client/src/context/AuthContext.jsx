import { createContext, useContext, useCallback, useState } from 'react';
import { api, getToken, setToken, getStoredUser, setStoredUser } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getStoredUser());

  const applySession = useCallback((data) => {
    setToken(data.token);
    setTokenState(data.token);
    setStoredUser(data.user);
    setUserState(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (email, password) => {
      const data = await api('/auth/register', { method: 'POST', body: { email, password } });
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setStoredUser(null);
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuth: Boolean(token), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}