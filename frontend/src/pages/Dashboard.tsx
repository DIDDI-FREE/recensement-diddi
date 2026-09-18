import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { LIBELLES_TYPES, type TypeFiche } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { synchroniser } from '../sync/syncManager';

const CARTES: { type: TypeFiche; icone: string; couleur: string }[] = [
  { type: 'chauffeur', icone: '🚗', couleur: 'bg-teal-600' },
  { type: 'livreur', icone: '🛵', couleur: 'bg-amber-600' },
  { type: 'restaurant', icone: '🍲', couleur: 'bg-orange-500' },
  { type: 'agent_commercial', icone: '🤝', couleur: 'bg-indigo-600' },
];

export default function Dashboard() {
  const online = useOnlineStatus();

  const fiches = useLiveQuery(() => db.fiches.orderBy('timestamp_local').reverse().toArray(), []);
  const enAttente = fiches?.filter((f) => !f.synced).length ?? 0;
  const synchronisees = fiches?.filter((f) => f.synced).length ?? 0;

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const duJour = fiches?.filter((f) => new Date(f.timestamp_local) >= debutJour).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Statut réseau + compteurs */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900">{duJour}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Synchronisées</p>
            <p className="text-2xl font-bold text-green-600">✅ {synchronisees}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-amber-600">⏳ {enAttente}</p>
          </div>
        </div>
        {!online && (
          <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
            📡 Hors ligne — vos fiches sont en sécurité sur le téléphone et seront
            synchronisées automatiquement au retour du réseau.
          </p>
        )}
        {online && enAttente > 0 && (
          <button
            onClick={() => void synchroniser()}
            className="mt-3 w-full rounded-md bg-teal-600 py-2 font-medium text-white hover:bg-teal-700"
          >
            Synchroniser maintenant ({enAttente})
          </button>
        )}
      </div>

      {/* Création de fiche */}
      <div className="grid grid-cols-1 gap-3">
        {CARTES.map(({ type, icone, couleur }) => (
          <Link
            key={type}
            to={`/nouveau/${type}`}
            className={`flex items-center gap-4 rounded-xl ${couleur} p-5 text-white shadow transition-transform active:scale-95`}
          >
            <span className="text-3xl">{icone}</span>
            <div>
              <p className="text-lg font-bold">{LIBELLES_TYPES[type]}</p>
              <p className="text-sm opacity-80">Nouvelle fiche de pré-enregistrement</p>
            </div>
            <span className="ml-auto text-2xl">›</span>
          </Link>
        ))}
      </div>

      <Link
        to="/registre"
        className="rounded-xl border border-teal-300 bg-white p-4 text-center font-medium text-teal-700 shadow-sm hover:bg-teal-50"
      >
        📋 Registre des pré-enregistrements ({fiches?.length ?? 0})
      </Link>
    </div>
  );
}
