import { useCallback, useEffect, useState } from 'react';
import type { Commercial } from '../types';
import { getToken, getUser, clearSession, setSession, api } from '../utils/api';

/** Gère la session du commercial (JWT 30 jours, travail offline ensuite). */
export function useAuth() {
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

  return { user, loading, erreur, login, logout, isAdmin: user?.role === 'admin' };
}
