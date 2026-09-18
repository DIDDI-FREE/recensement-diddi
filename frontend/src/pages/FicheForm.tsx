import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/dexie';
import {
  CHAMP_TELEPHONE_SUJET,
  FORM_DEFINITIONS,
  type FormDef,
} from '../forms/definitions';
import { LIBELLES_TYPES, type TypeFiche } from '../types';
import Field from '../components/Field';
import FormSection from '../components/FormSection';
import PhotoCapture from '../components/PhotoCapture';
import { getUser } from '../utils/api';
import { synchroniser } from '../sync/syncManager';
import type { Commercial } from '../types';

function genererUuid(): string {
  return crypto.randomUUID();
}

/** Formulaire par étapes, avec prise de photo et sauvegarde locale (IndexedDB). */
export default function FicheForm() {
  const { type } = useParams<{ type: TypeFiche }>();
  const navigate = useNavigate();
  const form: FormDef | undefined = type ? FORM_DEFINITIONS[type] : undefined;

  const [etape, setEtape] = useState(0);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, Blob | null>>({});
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces] = useState(false);

  const nbEtapes = useMemo(() => (form ? form.sections.length + 1 : 0), [form]); // +1 = photos

  if (!form || !type) {
    return (
      <div className="rounded-xl bg-white p-4 text-center text-gray-600">
        Type de fiche inconnu.
        <button onClick={() => navigate('/')} className="mt-2 block w-full text-teal-700 underline">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const onChange = (name: string, value: string) =>
    setValeurs((v) => ({ ...v, [name]: value }));

  const validerEtape = (): string[] => {
    if (etape >= form.sections.length) return [];
    const champs = form.sections[etape].fields;
    return champs
      .filter((f) => f.required && !valeurs[f.name]?.trim())
      .map((f) => `« ${f.label} » est requis`);
  };

  const allerEtapeSuivante = () => {
    const errs = validerEtape();
    setErreurs(errs);
    if (errs.length === 0) setEtape((e) => Math.min(e + 1, nbEtapes - 1));
  };

  const enregistrer = async () => {
    setErreurs([]);
    const user = getUser<Commercial>();
    if (!user) {
      setErreurs(['Session perdue — veuillez vous reconnecter']);
      return;
    }

    // Validation globale des champs requis
    const manquants = form.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.required && !valeurs[f.name]?.trim())
      .map((f) => `« ${f.label} » est requis`);
    if (manquants.length > 0) {
      setErreurs(manquants);
      return;
    }

    const telephoneSujet =
      valeurs[CHAMP_TELEPHONE_SUJET[type]]?.trim() ?? '';

    setSauvegarde(true);
    try {
      const idLocal = genererUuid();
      const timestampLocal = new Date().toISOString();

      // 1) Fiche dans IndexedDB (flag synced = false)
      await db.fiches.add({
        id_local: idLocal,
        type,
        commercial_id: user.id,
        timestamp_local: timestampLocal,
        synced: 0,
        statut: 'complet',
        telephone_sujet: telephoneSujet,
        donnees: { ...valeurs },
      });

      // 2) Photos compressées dans IndexedDB
      for (const slot of form.photos) {
        const blob = photos[slot.key];
        if (blob) {
          await db.photos.add({
            fiche_id_local: idLocal,
            type_photo: slot.key,
            blob,
            taille_octets: blob.size,
            synced: 0,
          });
        }
      }

      setSucces(true);

      // 3) En ligne : pousse IMMEDIATEMENT vers le serveur (sans attendre le polling 30 s)
      if (navigator.onLine) {
        void synchroniser();
      }
    } finally {
      setSauvegarde(false);
    }
  };

  if (succes) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 text-xl font-bold text-gray-900">Fiche enregistrée</h2>
        <p className="mt-1 text-sm text-gray-500">
          {LIBELLES_TYPES[type]} sauvegardé sur le téléphone.
          {navigator.onLine
            ? ' Synchronisation vers le serveur en cours…'
            : ' Hors ligne : la fiche sera synchronisée dès que le réseau reviendra.'}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => {
              setValeurs({});
              setPhotos({});
              setEtape(0);
              setSucces(false);
            }}
            className="rounded-md bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700"
          >
            Nouvelle fiche {form.titreCourt}
          </button>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-gray-100 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const estEtapePhotos = etape === form.sections.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm text-teal-700 underline">
          ‹ Annuler
        </button>
        <span className="text-xs font-medium text-gray-500">
          Étape {etape + 1}/{nbEtapes}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-teal-100">
        <div
          className="h-full bg-teal-600 transition-all"
          style={{ width: `${((etape + 1) / nbEtapes) * 100}%` }}
        />
      </div>

      <h1 className="text-lg font-bold text-gray-900">{form.titre}</h1>

      {erreurs.length > 0 && (
        <div className="rounded-md bg-red-50 p-3">
          {erreurs.map((e) => (
            <p key={e} className="text-sm text-red-700">
              • {e}
            </p>
          ))}
        </div>
      )}

      {estEtapePhotos ? (
        <FormSection titre="Photos à prendre">
          {form.photos.map((slot) => (
            <PhotoCapture
              key={slot.key}
              label={slot.label}
              value={photos[slot.key]}
              captureEnvironment={slot.key === 'facade'}
              onChange={(blob) => setPhotos((p) => ({ ...p, [slot.key]: blob }))}
            />
          ))}
        </FormSection>
      ) : (
        <FormSection titre={form.sections[etape].titre}>
          {form.sections[etape].fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={valeurs[field.name] ?? ''}
              onChange={onChange}
            />
          ))}
        </FormSection>
      )}

      <div className="flex gap-2">
        {etape > 0 && (
          <button
            onClick={() => {
              setErreurs([]);
              setEtape((e) => e - 1);
            }}
            className="flex-1 rounded-md bg-gray-200 py-3 font-medium text-gray-700 hover:bg-gray-300"
          >
            ‹ Précédent
          </button>
        )}
        {etape < nbEtapes - 1 ? (
          <button
            onClick={allerEtapeSuivante}
            className="flex-[2] rounded-md bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700"
          >
            Suivant ›
          </button>
        ) : (
          <button
            onClick={() => void enregistrer()}
            disabled={sauvegarde}
            className="flex-[2] rounded-md bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {sauvegarde ? 'Enregistrement…' : '💾 Enregistrer (hors-ligne OK)'}
          </button>
        )}
      </div>
    </div>
  );
}
