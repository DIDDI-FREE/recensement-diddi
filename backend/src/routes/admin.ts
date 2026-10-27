import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

function normaliserZones(zone: string, zones?: string[]): string[] {
  const valeurs = zones?.length ? zones : zone.split(',');
  return [...new Set(valeurs.map((valeur) => valeur.trim()).filter(Boolean))];
}

function normaliserNumeroWhatsApp(telephone: string): string {
  const chiffres = telephone.replace(/\D/g, '');
  const local = chiffres.startsWith('225') ? chiffres.slice(3) : chiffres;
  const numeroLocal = local.length === 9 ? `0${local}` : local;
  if (numeroLocal.length !== 10 || !numeroLocal.startsWith('0')) {
    throw new Error('Le numéro doit contenir 9 ou 10 chiffres ivoiriens');
  }
  return `225${numeroLocal}`;
}

function genererMotDePasseTemporaire(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  return Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

async function envoyerWhatsApp(numero: string, message: string): Promise<void> {
  const serverUrl = process.env.EVOLUTION_SERVER_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!serverUrl || !apiKey || !instance) {
    throw new Error('Evolution API non configurée : EVOLUTION_SERVER_URL, EVOLUTION_API_KEY et EVOLUTION_INSTANCE sont requis');
  }

  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number: numero, text: message }),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Evolution API a refusé l'envoi (${response.status})${details ? ` : ${details.slice(0, 200)}` : ''}`);
  }
}

const createCommercialSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().min(6).max(30),
  email: z.union([z.string().email().max(200), z.literal('')]).optional(),
  zone: z.string().min(1).max(100),
  mot_de_passe: z.string().min(6).max(100),
  role: z.enum(['commercial', 'superviseur', 'admin']).optional(),
  zones: z.array(z.string().min(1).max(100)).max(50).optional(),
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

  const { nom, prenom, telephone, email, zone, mot_de_passe, role, zones } = parsed.data;

  const existant = await prisma.commercial.findUnique({ where: { telephone } });
  if (existant) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec ce téléphone' });
  }

  const hash = await bcrypt.hash(mot_de_passe, 10);
  const commercial = await prisma.commercial.create({
    data: { nom, prenom, telephone, email: email || null, zone, zones: normaliserZones(zone, zones), motDePasse: hash, role: role ?? 'commercial' },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, zone: true, zones: true, role: true, actif: true, createdAt: true },
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
          zones: [ligne.commune],
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
      zones: true, role: true, actif: true, createdAt: true,
      _count: { select: { fiches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ commerciaux });
});

/** POST /api/admin/commerciaux/:id/envoyer-acces-whatsapp — réinitialise et envoie l'accès (admin uniquement) */
router.post('/commerciaux/:id/envoyer-acces-whatsapp', requireAuth, requireAdmin, async (req, res) => {
  const commercial = await prisma.commercial.findUnique({ where: { id: req.params.id } });
  if (!commercial) return res.status(404).json({ erreur: 'Compte introuvable' });

  let numero: string;
  try {
    numero = normaliserNumeroWhatsApp(commercial.telephone);
  } catch (error) {
    return res.status(400).json({ erreur: error instanceof Error ? error.message : 'Numéro de téléphone invalide' });
  }

  const nouveauMotDePasse = genererMotDePasseTemporaire();
  const message = [
    `Bonjour ${commercial.prenom} ${commercial.nom},`,
    '',
    'Voici vos nouveaux accès DiddiFree :',
    `Téléphone : ${commercial.telephone}`,
    `Mot de passe temporaire : ${nouveauMotDePasse}`,
    '',
    'Veuillez conserver ce message et modifier votre mot de passe après connexion.',
  ].join('\n');

  try {
    await envoyerWhatsApp(numero, message);
    await prisma.commercial.update({
      where: { id: commercial.id },
      data: { motDePasse: await bcrypt.hash(nouveauMotDePasse, 10) },
    });
    return res.json({ ok: true, numero });
  } catch (error) {
    return res.status(502).json({ erreur: error instanceof Error ? error.message : 'Envoi WhatsApp impossible' });
  }
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
      zones: z.array(z.string().min(1).max(100)).max(50).optional(),
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

  const { mot_de_passe, email, zones, ...rest } = parsed.data;
  const zonesFinales = zones ?? (parsed.data.zone ? normaliserZones(parsed.data.zone) : undefined);
  const updated = await prisma.commercial.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(zonesFinales ? { zones: zonesFinales, zone: zonesFinales[0] } : {}),
      ...(mot_de_passe ? { motDePasse: await bcrypt.hash(mot_de_passe, 10) } : {}),
    },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, zone: true, zones: true, role: true, actif: true },
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
  const parsed = z.object({ role: z.enum(['commercial', 'superviseur', 'admin']) }).safeParse(req.body);
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
