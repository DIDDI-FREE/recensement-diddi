import { useState } from 'react';
import type { FieldDef } from '../forms/definitions';

interface Props {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
}

/** Rendu d'un champ de formulaire (texte, date, select, GPS…). */
export default function Field({ field, value, onChange }: Props) {
  const [gpsEnCours, setGpsEnCours] = useState(false);
  const [gpsErreur, setGpsErreur] = useState<string | null>(null);

  const base =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

  const detecterGps = () => {
    if (!navigator.geolocation) {
      setGpsErreur('GPS non supporté par ce navigateur');
      return;
    }
    setGpsEnCours(true);
    setGpsErreur(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsEnCours(false);
        onChange(field.name, `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      () => {
        setGpsEnCours(false);
        setGpsErreur('Position indisponible — vérifiez le GPS/autorisation');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>

      {field.type === 'select' ? (
        <select
          className={base}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">— Sélectionner —</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          className={base}
          rows={3}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      ) : field.type === 'gps' ? (
        <div className="flex gap-2">
          <input
            className={base}
            value={value}
            placeholder="Lat, Long"
            onChange={(e) => onChange(field.name, e.target.value)}
          />
          <button
            type="button"
            onClick={detecterGps}
            disabled={gpsEnCours}
            className="shrink-0 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {gpsEnCours ? '…' : '📍 Détecter'}
          </button>
        </div>
      ) : (
        <input
          className={base}
          type={field.type}
          inputMode={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'numeric' : undefined}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )}

      {field.hint && !gpsErreur && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
      {gpsErreur && <p className="mt-1 text-xs text-red-600">{gpsErreur}</p>}
    </div>
  );
}
