import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

const createCommercialSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().min(6).max(30),
  zone: z.string().min(1).max(100),
  mot_de_passe: z.string().min(6).max(100),
});

/** POST /api/admin/commerciaux — créer un compte commercial (réservé admin) */
router.post('/commerciaux', requireAuth, requireAdmin, async (req, res) => {
  const parsed = createCommercialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      erreur: 'Données invalides',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const { nom, prenom, telephone, zone, mot_de_passe } = parsed.data;

  const existant = await prisma.commercial.findUnique({ where: { telephone } });
  if (existant) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec ce téléphone' });
  }

  const hash = await bcrypt.hash(mot_de_passe, 10);
  const commercial = await prisma.commercial.create({
    data: { nom, prenom, telephone, zone, motDePasse: hash },
    select: { id: true, nom: true, prenom: true, telephone: true, zone: true, actif: true, createdAt: true },
  });

  return res.status(201).json(commercial);
});

/** GET /api/admin/commerciaux — liste des commerciaux */
router.get('/commerciaux', requireAuth, requireAdmin, async (_req, res) => {
  const commerciaux = await prisma.commercial.findMany({
    select: {
      id: true, nom: true, prenom: true, telephone: true, zone: true,
      role: true, actif: true, createdAt: true,
      _count: { select: { fiches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ commerciaux });
});

/** PATCH /api/admin/commerciaux/:id — activer/désactiver un compte */
router.patch('/commerciaux/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ actif: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erreur: 'Body attendu : { actif: boolean }' });
  }

  const cible = await prisma.commercial.findUnique({ where: { id: req.params.id } });
  if (!cible) {
    return res.status(404).json({ erreur: 'Compte introuvable' });
  }
  if (cible.role === 'admin') {
    return res.status(400).json({ erreur: 'Impossible de désactiver un compte admin' });
  }

  const updated = await prisma.commercial.update({
    where: { id: req.params.id },
    data: { actif: parsed.data.actif },
    select: { id: true, nom: true, prenom: true, telephone: true, actif: true },
  });
  return res.json(updated);
});

export default router;
