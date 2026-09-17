import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/fiches — liste (filtres : type, statut, date). Un commercial ne voit que ses fiches. */
router.get('/', requireAuth, async (req, res) => {
  const query = z
    .object({
      type: z.enum(['chauffeur', 'restaurant', 'agent_commercial']).optional(),
      statut: z.enum(['brouillon', 'complet', 'doublon', 'valide']).optional(),
      date: z.string().date().optional(), // YYYY-MM-DD, sur timestamp_local
    })
    .safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ erreur: 'Filtres invalides' });
  }

  const { type, statut, date } = query.data;
  const where = {
    ...(req.user!.role !== 'admin' ? { commercialId: req.user!.id } : {}),
    ...(type ? { type } : {}),
    ...(statut ? { statut } : {}),
    ...(date
      ? {
          timestampLocal: {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59.999`),
          },
        }
      : {}),
  };

  const fiches = await prisma.fiche.findMany({
    where,
    orderBy: { timestampLocal: 'desc' },
    include: { photos: true, commercial: { select: { nom: true, prenom: true } } },
  });

  return res.json({
    fiches: fiches.map((f) => ({
      id: f.id,
      id_local: f.idLocal,
      type: f.type,
      statut: f.statut,
      telephone_sujet: f.telephoneSujet,
      timestamp_local: f.timestampLocal,
      synced_at: f.syncedAt,
      donnees: JSON.parse(f.donnees),
      photos: f.photos.map((p) => ({
        id: p.id,
        type_photo: p.typePhoto,
        url: `/api/photos/${p.fichierPath}`,
      })),
      commercial: f.commercial,
    })),
  });
});

/** GET /api/fiches/:id — détail d'une fiche */
router.get('/:id', requireAuth, async (req, res) => {
  const fiche = await prisma.fiche.findUnique({
    where: { id: req.params.id },
    include: { photos: true, commercial: { select: { nom: true, prenom: true, zone: true } } },
  });

  if (!fiche) {
    return res.status(404).json({ erreur: 'Fiche introuvable' });
  }
  if (req.user!.role !== 'admin' && fiche.commercialId !== req.user!.id) {
    return res.status(403).json({ erreur: 'Accès refusé' });
  }

  return res.json({
    id: fiche.id,
    id_local: fiche.idLocal,
    type: fiche.type,
    statut: fiche.statut,
    telephone_sujet: fiche.telephoneSujet,
    timestamp_local: fiche.timestampLocal,
    synced_at: fiche.syncedAt,
    donnees: JSON.parse(fiche.donnees),
    photos: fiche.photos.map((p) => ({
      id: p.id,
      type_photo: p.typePhoto,
      url: `/api/photos/${p.fichierPath}`,
    })),
    commercial: fiche.commercial,
  });
});

export default router;
