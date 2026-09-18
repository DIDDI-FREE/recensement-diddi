import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { Commercial } from '../types';
import { demarrerSyncAuto } from '../sync/syncManager';
import SyncIndicator from './SyncIndicator';

interface Props {
  user: Commercial;
  onLogout: () => void;
}

/** Structure commune : en-tête + indicateur réseau/sync + contenu + navigation basse. */
export default function Layout({ user, onLogout }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    // Synchronisation auto : retour réseau + polling 30 s
    const stop = demarrerSyncAuto();
    return stop;
  }, []);

  const lienNav = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
      isActive ? 'text-teal-700' : 'text-gray-500'
    }`;

  return (
    <div className="min-h-screen bg-teal-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-teal-700 text-white shadow">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-left text-lg font-bold leading-tight"
          >
            DiddiFree
            <span className="block text-xs font-normal opacity-80">
              {user.prenom} {user.nom} · {user.zone}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <button
              onClick={onLogout}
              className="rounded bg-teal-800 px-2 py-1 text-xs hover:bg-teal-900"
              title="Se déconnecter"
            >
              Sortir
            </button>
          </div>
        </div>
      </header>

      {/* marge basse pour ne pas masquer le contenu derrière la navigation */}
      <main className="mx-auto max-w-xl px-4 py-4 pb-24">
        <Outlet />
      </main>

      {/* Navigation basse — retour au menu principal en un toucher */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-xl">
          <NavLink to="/" end className={lienNav}>
            <span className="text-xl">🏠</span>
            Accueil
          </NavLink>
          <NavLink to="/registre" className={lienNav}>
            <span className="text-xl">📋</span>
            Registre
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/gestion" className={lienNav}>
              <span className="text-xl">👥</span>
              Équipe
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}
