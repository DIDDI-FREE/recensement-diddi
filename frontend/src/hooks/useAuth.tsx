import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Commercial } from '../types';
import { getToken, getUser, clearSession, setSession, api } from '../utils/api';

interface AuthState {
  user: Commercial | null;
  loading: boolean;
  erreur: string | null;
  login: (telephone: string, motDePasse: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Session du commercial (JWT 30 jours, travail offline ensuite).
 * Partagée via contexte : Login et App voient le même état,
 * donc un login réussi bascule immédiatement sur l'accueil.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Commercial | null>(() => {
    return getToken() ? getUser<Commercial>() : null;
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Vérifie la validité du token quand on est en ligne
    if (!getToken()) return;
    api<{ id: string }>('/auth/me')
      .then(() => setUser(getUser<Commercial>()))
      .catch(() => setUser(null));
  }, []);

  const login = useCallback(async (telephone: string, motDePasse: string) => {
    setLoading(true);
    setErreur(null);
    try {
      const res = await api<{ token: string; commercial: Commercial }>('/auth/login', {
        method: 'POST',
        body: { telephone, mot_de_passe: motDePasse },
      });
      setSession(res.token, res.commercial);
      setUser(res.commercial);
      return true;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshed = await api<Commercial>('/auth/me');
    const token = getToken();
    if (token) setSession(token, refreshed);
    setUser(refreshed);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, erreur, login, logout, refreshUser, isAdmin: user?.role === 'admin', isSupervisor: user?.role === 'superviseur' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
}
