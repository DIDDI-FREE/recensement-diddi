import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Sauvegarde une photo encodée en base64 (data URL) dans UPLOAD_DIR.
 * Retourne le chemin relatif du fichier.
 */
export function savePhoto(ficheIdLocal: string, typePhoto: string, dataUrl: string): string {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Format de photo invalide (data URL attendue)');
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');

  // Nom de fichier : <idLocal>_<typePhoto>.<ext> — idempotent si re-sync
  const safeType = typePhoto.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const fileName = `${ficheIdLocal}_${safeType}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  return fileName;
}

export function photoAbsolutePath(fileName: string): string {
  return path.join(UPLOAD_DIR, path.basename(fileName));
}
