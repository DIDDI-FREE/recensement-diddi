import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { processSync, syncBodySchema } from '../services/syncService';

const router = Router();

/**
 * POST /api/sync — reçoit un batch de fiches + photos saisis hors-ligne.
 * Body : { fiches: [...], photos: [...] }
 * Réponse : { resultats: [{ id_local, statut, message }] }
 */
router.post('/', requireAuth, async (req, res) => {
  const parsed = syncBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      erreur: 'Corps de requête invalide',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const resultats = await processSync(req.user!.id, parsed.data);
  return res.json({ resultats });
});

export default router;
