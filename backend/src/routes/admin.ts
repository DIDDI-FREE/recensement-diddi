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
  email: z.union([z.string().email().max(200), z.literal('')]).optional(),
  zone: z.string().min(1).max(100),
  mot_de_passe: z.string().min(6).max(100),
  role: z.enum(['commercial', 'admin']).optional(),
});

const importCommercialSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().min(6).max(30),
  email: z.union([z.string().email().max(200), z.literal('')]).optional(),
  commune: z.string().min(1).max(100),
  mot_de_passe: z.string().min(6).max(100),
});

/** POST /api/admin/commerciaux — créer un compte commercial ou admin (réservé admin) */
router.post('/commerciaux', requireAuth, requireAdmin, async (req, res) => {
  const parsed = createCommercialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      erreur: 'Données invalides',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const { nom, prenom, telephone, email, zone, mot_de_passe, role } = parsed.data;

  const existant = await prisma.commercial.findUnique({ where: { telephone } });
  if (existant) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec ce téléphone' });
  }

  const hash = await bcrypt.hash(mot_de_passe, 10);
  const commercial = await prisma.commercial.create({
    data: { nom, prenom, telephone, email: email || null, zone, motDePasse: hash, role: role ?? 'commercial' },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, zone: true, role: true, actif: true, createdAt: true },
  });

  return res.status(201).json(commercial);
});

/** POST /api/admin/commerciaux/import — import CSV préparé côté frontend (admin uniquement) */
router.post('/commerciaux/import', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ lignes: z.array(importCommercialSchema).min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      erreur: 'Fichier invalide',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const resultats: { telephone: string; statut: 'créé' | 'ignoré' | 'erreur'; message: string }[] = [];
  for (const ligne of parsed.data.lignes) {
    try {
      const existant = await prisma.commercial.findUnique({ where: { telephone: ligne.telephone } });
      if (existant) {
        resultats.push({ telephone: ligne.telephone, statut: 'ignoré', message: 'Compte déjà existant' });
        continue;
      }

      await prisma.commercial.create({
        data: {
          nom: ligne.nom,
          prenom: ligne.prenom,
          telephone: ligne.telephone,
          email: ligne.email || null,
          zone: ligne.commune,
          motDePasse: await bcrypt.hash(ligne.mot_de_passe, 10),
          role: 'commercial',
        },
      });
      resultats.push({ telephone: ligne.telephone, statut: 'créé', message: 'Compte créé' });
    } catch (error) {
      resultats.push({
        telephone: ligne.telephone,
        statut: 'erreur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  return res.status(201).json({
    resultats,
    created: resultats.filter((r) => r.statut === 'créé').length,
    skipped: resultats.filter((r) => r.statut === 'ignoré').length,
    errors: resultats.filter((r) => r.statut === 'erreur').length,
  });
});

/** GET /api/admin/commerciaux — liste des commerciaux */
router.get('/commerciaux', requireAuth, requireAdmin, async (_req, res) => {
  const commerciaux = await prisma.commercial.findMany({
    select: {
      id: true, nom: true, prenom: true, telephone: true, email: true, zone: true,
      role: true, actif: true, createdAt: true,
      _count: { select: { fiches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ commerciaux });
});

/** PATCH /api/admin/commerciaux/:id — activer/désactiver un compte */
router.patch('/commerciaux/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      actif: z.boolean().optional(),
      nom: z.string().min(1).max(100).optional(),
      prenom: z.string().min(1).max(100).optional(),
      telephone: z.string().min(6).max(30).optional(),
      email: z.union([z.string().email().max(200), z.literal('')]).optional(),
      zone: z.string().min(1).max(100).optional(),
      mot_de_passe: z.string().min(6).max(100).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Au moins un champ est requis')
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erreur: 'Données de modification invalides' });
  }

  const cible = await prisma.commercial.findUnique({ where: { id: req.params.id } });
  if (!cible) {
    return res.status(404).json({ erreur: 'Compte introuvable' });
  }
  if (cible.role === 'admin' && parsed.data.actif === false) {
    return res.status(400).json({ erreur: 'Impossible de désactiver un compte admin' });
  }

  const { mot_de_passe, email, ...rest } = parsed.data;
  const updated = await prisma.commercial.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(mot_de_passe ? { motDePasse: await bcrypt.hash(mot_de_passe, 10) } : {}),
    },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, zone: true, actif: true },
  });
  return res.json(updated);
});

/** GET /api/admin/commerciaux/:id/fiches — fiches d'un commercial (admin uniquement) */
router.get('/commerciaux/:id/fiches', requireAuth, requireAdmin, async (req, res) => {
  const commercial = await prisma.commercial.findUnique({ where: { id: req.params.id } });
  if (!commercial) return res.status(404).json({ erreur: 'Compte introuvable' });

  const fiches = await prisma.fiche.findMany({
    where: { commercialId: commercial.id },
    orderBy: { timestampLocal: 'desc' },
    include: { photos: true },
  });
  return res.json({
    commercial: { id: commercial.id, nom: commercial.nom, prenom: commercial.prenom },
    fiches: fiches.map((fiche) => ({
      id: fiche.id,
      id_local: fiche.idLocal,
      type: fiche.type,
      statut: fiche.statut,
      telephone_sujet: fiche.telephoneSujet,
      timestamp_local: fiche.timestampLocal,
      donnees: JSON.parse(fiche.donnees),
      photos: fiche.photos.map((photo) => ({
        id: photo.id,
        type_photo: photo.typePhoto,
        url: `/api/photos/${photo.fichierPath}`,
      })),
    })),
  });
});

/** PATCH /api/admin/commerciaux/:id/role — promouvoir/rétrograder un compte (admin) */
router.patch('/commerciaux/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ role: z.enum(['commercial', 'admin']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erreur: 'Body attendu : { role: "commercial" | "admin" }' });
  }

  const cible = await prisma.commercial.findUnique({ where: { id: req.params.id } });
  if (!cible) {
    return res.status(404).json({ erreur: 'Compte introuvable' });
  }
  if (cible.id === req.user!.id && parsed.data.role !== 'admin') {
    return res.status(400).json({ erreur: 'Vous ne pouvez pas rétrograder votre propre compte' });
  }

  const updated = await prisma.commercial.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, nom: true, prenom: true, telephone: true, role: true },
  });
  return res.json(updated);
});

export default router;
