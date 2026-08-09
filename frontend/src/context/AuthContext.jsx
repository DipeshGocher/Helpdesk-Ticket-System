import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, fetchMe } from '../api/authApi';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/axiosInstance';

const AuthContext = createContext(null);

// Must be rendered inside <BrowserRouter> (not wrapping it) so it can call useNavigate()
// and register itself as the axios instance's 401 handler.
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // On mount, hydrate `user` from the server (not by decoding the JWT client-side) -
  // this doubles as confirmation the stored token is still valid.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetchMe();
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) clearAuthState();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearAuthState]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthState();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [clearAuthState, navigate]);

  const login = useCallback(async ({ email, password, role }) => {
    const res = await loginApi({ email, password, role });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const res = await registerApi({ name, email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthState();
    navigate('/login', { replace: true });
  }, [clearAuthState, navigate]);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
