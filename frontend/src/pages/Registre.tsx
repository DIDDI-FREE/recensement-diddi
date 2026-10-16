import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { LIBELLES_TYPES, type TypeFiche } from '../types';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

type FiltreType = 'tous' | TypeFiche;
type FiltreStatut = 'tous' | 'synced' | 'pending';

interface FicheServeur {
  id: string;
  id_local: string;
  type: TypeFiche;
  statut: 'complet' | 'doublon' | 'valide';
  telephone_sujet: string;
  timestamp_local: string;
  synced_at: string | null;
  donnees: Record<string, unknown>;
  photos: { id: string; type_photo: string; url: string }[];
  commercial: { nom: string; prenom: string };
}

/** Registre local : toutes les fiches du commercial, avec statut de sync. */
export default function Registre() {
  const { isAdmin } = useAuth();
  const [filtreType, setFiltreType] = useState<FiltreType>('tous');
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');
  const [fichesServeur, setFichesServeur] = useState<FicheServeur[]>([]);
  const [chargementServeur, setChargementServeur] = useState(false);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const fiches = useLiveQuery(
    () => db.fiches.orderBy('timestamp_local').reverse().toArray(),
    []
  );

  useEffect(() => {
    if (!isAdmin) return;
    setChargementServeur(true);
    void api<{ fiches: FicheServeur[] }>('/fiches')
      .then((result) => {
        setFichesServeur(result.fiches);
        setErreurServeur(null);
      })
      .catch((error: unknown) => setErreurServeur(error instanceof Error ? error.message : 'Chargement impossible'))
      .finally(() => setChargementServeur(false));
  }, [isAdmin]);

  const visibles = (isAdmin ? fichesServeur : fiches ?? []).filter((f) => {
    if (filtreType !== 'tous' && f.type !== filtreType) return false;
    if (filtreStatut === 'synced' && !('synced_at' in f ? f.synced_at : f.synced)) return false;
    if (filtreStatut === 'pending' && ('synced_at' in f ? f.synced_at : f.synced)) return false;
    return true;
  });

  const selectStyle =
    'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Registre</h1>
        <span className="text-sm text-gray-500">{visibles.length} fiche(s)</span>
      </div>

      {isAdmin && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Vue administrateur : toutes les fiches synchronisées, quel que soit le compte commercial.</p>}
      {erreurServeur && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreurServeur}</p>}

      <div className="flex gap-2">
        <select
          className={selectStyle}
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value as FiltreType)}
        >
          <option value="tous">Tous types</option>
          {(Object.keys(LIBELLES_TYPES) as TypeFiche[]).map((t) => (
            <option key={t} value={t}>
              {LIBELLES_TYPES[t]}
            </option>
          ))}
        </select>
        <select
          className={selectStyle}
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
        >
          <option value="tous">Tous statuts</option>
          <option value="synced">✅ Synchronisées</option>
          <option value="pending">⏳ En attente</option>
        </select>
      </div>

      {chargementServeur && <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">Chargement des fiches…</p>}

      {!chargementServeur && visibles.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">
          Aucune fiche pour ce filtre.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {visibles.map((f) => (
          <Link
            key={f.id_local}
            to={`/fiche/${'id' in f ? f.id : f.id_local}`}
            className="rounded-xl bg-white p-4 shadow-sm active:bg-teal-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">
                {(f.donnees.nom_enseigne as string) ||
                  (`${f.donnees.nom ?? ''} ${f.donnees.prenoms ?? ''}`.trim() ||
                    LIBELLES_TYPES[f.type])}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  ('synced_at' in f ? true : f.synced)
                    ? f.statut === 'doublon'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {('synced_at' in f ? true : f.synced) ? (f.statut === 'doublon' ? '⚠ Doublon' : '✅ Synchro') : '⏳ En attente'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
              <span>{LIBELLES_TYPES[f.type]}</span>
              <span>{new Date(f.timestamp_local).toLocaleString('fr-FR')}</span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">📞 {f.telephone_sujet}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
