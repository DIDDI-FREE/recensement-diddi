import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

function plageJour(date: string | undefined): { gte: Date; lt: Date } | undefined {
  if (!date) return undefined;
  const debut = new Date(`${date}T00:00:00+01:00`);
  return { gte: debut, lt: new Date(debut.getTime() + 24 * 60 * 60 * 1000) };
}

/** GET /api/stats — résultats agrégés selon le périmètre du rôle connecté. */
router.get('/', requireAuth, async (req, res) => {
  const parsed = z.object({ date: z.string().date().optional() }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ erreur: 'Date invalide' });

  const scope = req.user!.role === 'admin'
    ? {}
    : req.user!.role === 'superviseur'
      ? { zoneEnregistrement: { in: req.user!.zones } }
      : { commercialId: req.user!.id };
  const jour = plageJour(parsed.data.date);
  const fiches = await prisma.fiche.findMany({
    where: { ...scope, ...(jour ? { timestampLocal: jour } : {}) },
    select: {
      type: true,
      statut: true,
      timestampLocal: true,
      commercial: { select: { id: true, nom: true, prenom: true, zone: true } },
    },
  });

  const aujourdHui = plageJour(new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Abidjan' }));
  const parCommercial = new Map<string, {
    commercial: { id: string; nom: string; prenom: string; zone: string };
    total: number;
    par_type: Record<string, number>;
    par_statut: Record<string, number>;
  }>();
  for (const fiche of fiches) {
    const current = parCommercial.get(fiche.commercial.id) ?? {
      commercial: fiche.commercial,
      total: 0,
      par_type: {},
      par_statut: {},
    };
    current.total += 1;
    current.par_type[fiche.type] = (current.par_type[fiche.type] ?? 0) + 1;
    current.par_statut[fiche.statut] = (current.par_statut[fiche.statut] ?? 0) + 1;
    parCommercial.set(fiche.commercial.id, current);
  }

  const total = fiches.length;
  const aujourdHuiCount = parsed.data.date
    ? total
    : await prisma.fiche.count({ where: { ...scope, timestampLocal: aujourdHui } });

  return res.json({
    total,
    aujourd_hui: aujourdHuiCount,
    par_commercial: [...parCommercial.values()].sort((a, b) => b.total - a.total),
  });
});

export default router;
