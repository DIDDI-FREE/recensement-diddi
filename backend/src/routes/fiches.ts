import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/fiches — liste filtrée selon le rôle, la zone et la date. */
router.get('/', requireAuth, async (req, res) => {
  const query = z
    .object({
      type: z.enum(['chauffeur', 'livreur', 'restaurant', 'agent_commercial']).optional(),
      statut: z.enum(['brouillon', 'complet', 'doublon', 'valide']).optional(),
      date: z.string().date().optional(), // YYYY-MM-DD, sur timestamp_local
    })
    .safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ erreur: 'Filtres invalides' });
  }

  const { type, statut, date } = query.data;
  const debutDate = date ? new Date(`${date}T00:00:00+01:00`) : undefined;
  const finDate = debutDate ? new Date(debutDate.getTime() + 24 * 60 * 60 * 1000) : undefined;
  const scope = req.user!.role === 'admin'
    ? {}
    : req.user!.role === 'superviseur'
      ? { zoneEnregistrement: { in: req.user!.zones } }
      : { commercialId: req.user!.id };
  const where = {
    ...scope,
    ...(type ? { type } : {}),
    ...(statut ? { statut } : {}),
    ...(date
      ? {
          timestampLocal: {
            gte: debutDate,
            lt: finDate,
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

/** GET /api/fiches/commercial/:id — fiches d'un commercial dans le périmètre autorisé. */
router.get('/commercial/:commercialId', requireAuth, async (req, res) => {
  const target = await prisma.commercial.findUnique({ where: { id: req.params.commercialId } });
  if (!target) return res.status(404).json({ erreur: 'Commercial introuvable' });
  if (req.user!.role === 'commercial' && target.id !== req.user!.id) return res.status(403).json({ erreur: 'Accès refusé' });
  if (req.user!.role === 'superviseur' && !req.user!.zones.includes(target.zone)) return res.status(403).json({ erreur: 'Commercial hors de votre périmètre' });

  const fiches = await prisma.fiche.findMany({
    where: {
      commercialId: target.id,
      ...(req.user!.role === 'superviseur' ? { zoneEnregistrement: { in: req.user!.zones } } : {}),
    },
    orderBy: { timestampLocal: 'desc' },
    include: { photos: true },
  });
  return res.json({
    commercial: { id: target.id, nom: target.nom, prenom: target.prenom, zone: target.zone },
    fiches: fiches.map((fiche) => ({
      id: fiche.id,
      id_local: fiche.idLocal,
      type: fiche.type,
      statut: fiche.statut,
      telephone_sujet: fiche.telephoneSujet,
      timestamp_local: fiche.timestampLocal,
      donnees: JSON.parse(fiche.donnees),
      photos: fiche.photos.map((photo) => ({ id: photo.id, type_photo: photo.typePhoto, url: `/api/photos/${photo.fichierPath}` })),
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
  const autorise = req.user!.role === 'admin'
    || (req.user!.role === 'commercial' && fiche.commercialId === req.user!.id)
    || (req.user!.role === 'superviseur' && Boolean(fiche.zoneEnregistrement && req.user!.zones.includes(fiche.zoneEnregistrement)));
  if (!autorise) {
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
