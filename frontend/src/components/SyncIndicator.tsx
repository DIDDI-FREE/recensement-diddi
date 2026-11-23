import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ecouterSync, getSyncStatut, synchroniser, type SyncStatut } from '../sync/syncManager';

/** Badge réseau + compteur de fiches en attente + état explicite de synchronisation. */
export default function SyncIndicator() {
  const online = useOnlineStatus();
  const enAttente = useLiveQuery(() => db.fiches.where('synced').equals(0).count(), []) ?? 0;
  const [statut, setStatut] = useState<SyncStatut>(getSyncStatut());

  useEffect(() => ecouterSync(setStatut), []);

  const couleurStatut = statut.etat === 'error'
    ? 'text-red-700'
    : statut.etat === 'success'
      ? 'text-emerald-700'
      : statut.etat === 'syncing'
        ? 'text-blue-700'
        : 'text-slate-600';

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        title={online ? 'En ligne' : 'Hors ligne — les fiches sont sauvegardées sur le téléphone'}
      >
        {online ? '● En ligne' : '● Hors ligne'}
      </span>
      {enAttente > 0 && (
        <button
          type="button"
          disabled={!online || statut.etat === 'syncing'}
          onClick={() => void synchroniser().catch(() => undefined)}
          className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-wait disabled:opacity-70"
          title="Fiches en attente de synchronisation — toucher pour synchroniser"
          aria-label={`Synchroniser ${enAttente} fiche(s)`}
        >
          {statut.etat === 'syncing' ? 'Synchronisation…' : `Synchroniser (${enAttente})`}
        </button>
      )}
      {statut.message && (
        <span role="status" aria-live="polite" className={`max-w-[150px] truncate text-[11px] font-medium sm:max-w-[250px] sm:text-xs ${couleurStatut}`} title={statut.message}>
          {statut.message}
        </span>
      )}
    </div>
  );
}
