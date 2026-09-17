import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { synchroniser } from '../sync/syncManager';

/** Badge réseau + compteur de fiches en attente de sync + bouton sync manuel. */
export default function SyncIndicator() {
  const online = useOnlineStatus();
  const enAttente = useLiveQuery(() => db.fiches.where('synced').equals(0).count(), []) ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}
        title={online ? 'En ligne' : 'Hors ligne — les fiches sont sauvegardées sur le téléphone'}
      >
        {online ? '● En ligne' : '● Hors ligne'}
      </span>
      {enAttente > 0 && (
        <button
          onClick={() => void synchroniser()}
          className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-600"
          title="Fiches en attente de synchronisation — toucher pour synchroniser"
        >
          ⏳ {enAttente}
        </button>
      )}
    </div>
  );
}
