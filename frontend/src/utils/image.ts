import imageCompression from 'browser-image-compression';

/**
 * Compresse une photo avant stockage IndexedDB :
 * max 1200px de côté, JPEG qualité ~75 %, cible ≤ 500 Ko.
 */
export async function compresserPhoto(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.75,
  };
  return imageCompression(file, options);
}

/** Blob → data URL (pour l'envoi au serveur lors du sync) */
export function blobVersDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Blob → object URL (pour l'affichage local des aperçus) */
export function blobVersObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
