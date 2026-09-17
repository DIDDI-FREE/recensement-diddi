import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken, requireAuth } from '../middleware/auth';
import type { AuthUser } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  telephone: z.string().min(6).max(30),
  mot_de_passe: z.string().min(1),
});

function toAuthUser(c: {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone: string;
  role: string;
}): AuthUser {
  return {
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    telephone: c.telephone,
    zone: c.zone,
    role: c.role === 'admin' ? 'admin' : 'commercial',
  };
}

/** POST /api/auth/login — connexion (une seule fois en ligne, puis offline) */
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erreur: 'Téléphone et mot de passe requis' });
  }

  const { telephone, mot_de_passe } = parsed.data;
  const commercial = await prisma.commercial.findUnique({ where: { telephone } });

  if (!commercial || !commercial.actif) {
    return res.status(401).json({ erreur: 'Identifiants invalides' });
  }

  const ok = await bcrypt.compare(mot_de_passe, commercial.motDePasse);
  if (!ok) {
    return res.status(401).json({ erreur: 'Identifiants invalides' });
  }

  const user = toAuthUser(commercial);
  return res.json({ token: signToken(user), commercial: user });
});

/** GET /api/auth/me — infos du commercial connecté */
router.get('/me', requireAuth, async (req, res) => {
  const commercial = await prisma.commercial.findUnique({
    where: { id: req.user!.id },
    select: { id: true, nom: true, prenom: true, telephone: true, zone: true, role: true, actif: true },
  });
  if (!commercial || !commercial.actif) {
    return res.status(401).json({ erreur: 'Compte introuvable ou désactivé' });
  }
  return res.json(commercial);
});

export default router;
