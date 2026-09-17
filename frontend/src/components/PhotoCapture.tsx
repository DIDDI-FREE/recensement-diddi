import { useRef, useState } from 'react';
import { compresserPhoto, blobVersObjectUrl } from '../utils/image';

interface Props {
  label: string;
  /** Blob compressé courant (édition) */
  value?: Blob | null;
  onChange: (blob: Blob | null) => void;
  /** Ouvre directement l'appareil photo (arrière) plutôt que le sélecteur */
  captureEnvironment?: boolean;
}

/**
 * Prise de photo : caméra ou galerie (Android laisse le choix),
 * compression automatique avant stockage IndexedDB.
 */
export default function PhotoCapture({ label, value, onChange, captureEnvironment }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compression, setCompression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    value ? blobVersObjectUrl(value) : null
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErreur(null);
    setCompression(true);
    try {
      const blob = await compresserPhoto(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(blobVersObjectUrl(blob));
      onChange(blob);
    } catch {
      setErreur('Compression impossible, photo non ajoutée');
    } finally {
      setCompression(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const reinitialiser = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(null);
  };

  return (
    <div className="rounded-lg border border-teal-200 bg-white p-3">
      <p className="mb-2 text-sm font-medium text-gray-800">{label}</p>

      {previewUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={previewUrl}
            alt={label}
            className="h-20 w-20 rounded-md border border-gray-200 object-cover"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700"
            >
              Remplacer
            </button>
            <button
              type="button"
              onClick={reinitialiser}
              className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={compression}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-teal-300 py-4 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"
        >
          {compression ? 'Compression…' : '📷 Prendre une photo'}
        </button>
      )}

      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(captureEnvironment ? { capture: 'environment' as const } : {})}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
