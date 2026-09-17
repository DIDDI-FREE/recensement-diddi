import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { LIBELLES_TYPES, type TypeFiche } from '../types';

type FiltreType = 'tous' | TypeFiche;
type FiltreStatut = 'tous' | 'synced' | 'pending';

/** Registre local : toutes les fiches du commercial, avec statut de sync. */
export default function Registre() {
  const [filtreType, setFiltreType] = useState<FiltreType>('tous');
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');

  const fiches = useLiveQuery(
    () => db.fiches.orderBy('timestamp_local').reverse().toArray(),
    []
  );

  const visibles = (fiches ?? []).filter((f) => {
    if (filtreType !== 'tous' && f.type !== filtreType) return false;
    if (filtreStatut === 'synced' && !f.synced) return false;
    if (filtreStatut === 'pending' && f.synced) return false;
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

      {visibles.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">
          Aucune fiche pour ce filtre.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {visibles.map((f) => (
          <Link
            key={f.id_local}
            to={`/fiche/${f.id_local}`}
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
                  f.synced
                    ? f.statut === 'doublon'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {f.synced ? (f.statut === 'doublon' ? '⚠ Doublon' : '✅ Synchro') : '⏳ En attente'}
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
