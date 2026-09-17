import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/** GET /api/stats — compteurs pour le dashboard */
router.get('/', requireAuth, async (req, res) => {
  const filtreCommercial = req.user!.role !== 'admin' ? { commercialId: req.user!.id } : {};

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);

  const [parType, parStatut, aujourdHui] = await Promise.all([
    prisma.fiche.groupBy({ by: ['type'], where: filtreCommercial, _count: true }),
    prisma.fiche.groupBy({ by: ['statut'], where: filtreCommercial, _count: true }),
    prisma.fiche.count({
      where: { ...filtreCommercial, timestampLocal: { gte: debutJour, lt: finJour } },
    }),
  ]);

  return res.json({
    total: parType.reduce((acc, g) => acc + g._count, 0),
    aujourd_hui: aujourdHui,
    par_type: Object.fromEntries(parType.map((g) => [g.type, g._count])),
    par_statut: Object.fromEntries(parStatut.map((g) => [g.statut, g._count])),
  });
});

export default router;
