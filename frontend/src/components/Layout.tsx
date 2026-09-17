import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { Commercial } from '../types';
import { demarrerSyncAuto } from '../sync/syncManager';
import SyncIndicator from './SyncIndicator';

interface Props {
  user: Commercial;
  onLogout: () => void;
}

/** Structure commune : en-tête + indicateur réseau/sync + contenu. */
export default function Layout({ user, onLogout }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    // Synchronisation auto : retour réseau + polling 30 s
    const stop = demarrerSyncAuto();
    return stop;
  }, []);

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
      <main className="mx-auto max-w-xl px-4 py-4 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
