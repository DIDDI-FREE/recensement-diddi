import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { FORM_DEFINITIONS } from '../forms/definitions';
import { LIBELLES_TYPES } from '../types';
import { blobVersObjectUrl } from '../utils/image';

/** Détail lecture seule d'une fiche + ses photos locales. */
export default function FicheDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const fiche = useLiveQuery(() => (id ? db.fiches.get(id) : undefined), [id]);
  const photos = useLiveQuery(
    () => (id ? db.photos.where('fiche_id_local').equals(id).toArray() : []),
    [id]
  );

  // URLs d'aperçu des photos locales (à révoquer au démontage)
  useEffect(() => {
    if (!photos) return;
    const urls = photos.map((p) => blobVersObjectUrl(p.blob));
    setObjectUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  if (fiche === undefined) {
    return <p className="text-center text-gray-500">Chargement…</p>;
  }
  if (fiche === null) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-gray-600">
        Fiche introuvable.
        <button onClick={() => navigate('/registre')} className="mt-2 block w-full text-teal-700 underline">
          Retour au registre
        </button>
      </div>
    );
  }

  const form = FORM_DEFINITIONS[fiche.type];

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/registre')} className="text-left text-sm text-teal-700 underline">
        ‹ Retour au registre
      </button>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{LIBELLES_TYPES[fiche.type]}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              fiche.synced
                ? fiche.statut === 'doublon'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {fiche.synced ? (fiche.statut === 'doublon' ? '⚠ Doublon' : '✅ Synchronisée') : '⏳ En attente'}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Saisie le {new Date(fiche.timestamp_local).toLocaleString('fr-FR')}
        </p>
      </div>

      {form.sections.map((section) => (
        <section key={section.titre} className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">
            {section.titre}
          </h2>
          <dl className="flex flex-col gap-2">
            {section.fields
              .filter((f) => {
                const v = fiche.donnees[f.name];
                return v !== undefined && v !== null && String(v).trim() !== '';
              })
              .map((f) => (
                <div key={f.name} className="flex justify-between gap-4 text-sm">
                  <dt className="shrink-0 text-gray-500">{f.label}</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {String(fiche.donnees[f.name])}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ))}

      {photos && photos.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">Photos</h2>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p, i) => (
              <figure key={p.id ?? i}>
                <img
                  src={objectUrls[i]}
                  alt={p.type_photo}
                  className="h-32 w-full rounded-md border border-gray-200 object-cover"
                />
                <figcaption className="mt-1 text-xs text-gray-500">
                  {form.photos.find((s) => s.key === p.type_photo)?.label ?? p.type_photo}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
