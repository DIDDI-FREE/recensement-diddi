import { Router } from 'express';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { photoAbsolutePath } from '../services/photoService';

const router = Router();

/** GET /api/photos/:file — sert une photo uploadée (authentifié) */
router.get('/:file', requireAuth, (req, res) => {
  const file = photoAbsolutePath(req.params.file);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ erreur: 'Photo introuvable' });
  }
  const ext = file.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  fs.createReadStream(file).pipe(res);
});

export default router;
