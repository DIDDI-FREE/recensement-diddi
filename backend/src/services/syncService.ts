import { z } from 'zod';
import prisma from '../lib/prisma';
import { savePhoto } from './photoService';

export const TYPES_FICHE = ['chauffeur', 'livreur', 'restaurant', 'agent_commercial'] as const;

const photoSchema = z.object({
  fiche_id_local: z.string().uuid(),
  type_photo: z.string().min(1).max(60),
  data_url: z.string().startsWith('data:image/'),
  taille_octets: z.number().int().nonnegative().optional(),
});

const ficheSchema = z.object({
  id_local: z.string().uuid(),
  type: z.enum(TYPES_FICHE),
  timestamp_local: z.string().datetime({ offset: true }),
  telephone_sujet: z.string().min(6).max(30),
  donnees: z.record(z.unknown()),
  statut: z.enum(['brouillon', 'complet']).optional(),
});

export const syncBodySchema = z.object({
  fiches: z.array(ficheSchema).max(200),
  photos: z.array(photoSchema).max(500).default([]),
});

export type SyncBody = z.infer<typeof syncBodySchema>;

export interface SyncResultat {
  id_local: string;
  statut: 'ok' | 'doublon' | 'erreur';
  message: string;
}

/**
 * Traite un batch de fiches + photos.
 *
 * - Idempotence : si id_local déjà connu → OK (la fiche existe déjà, on ne recrée pas).
 * - Détection de doublons : clé (telephone_sujet, type). La fiche avec le
 *   timestamp_local le plus ancien garde le statut "complet", l'autre passe "doublon".
 */
export async function processSync(
  commercialId: string,
  body: SyncBody
): Promise<SyncResultat[]> {
  const resultats: SyncResultat[] = [];
  const photosByFiche = new Map<string, typeof body.photos>();
  for (const photo of body.photos) {
    const list = photosByFiche.get(photo.fiche_id_local) ?? [];
    list.push(photo);
    photosByFiche.set(photo.fiche_id_local, list);
  }

  for (const fiche of body.fiches) {
    try {
      const resultat = await prisma.$transaction(async (tx) => {
        // 1) Idempotence : déjà reçue ?
        const existante = await tx.fiche.findUnique({ where: { idLocal: fiche.id_local } });
        if (existante) {
          return { statut: 'ok' as const, message: 'Fiche déjà synchronisée (idempotence)' };
        }

        // 2) Détection de doublon sur (telephone_sujet, type)
        const doublon = await tx.fiche.findFirst({
          where: { telephoneSujet: fiche.telephone_sujet, type: fiche.type },
          orderBy: { timestampLocal: 'asc' },
        });

        let statut: 'complet' | 'doublon' = 'complet';
        if (doublon) {
          const tsNouvelle = new Date(fiche.timestamp_local);
          const tsExistante = new Date(doublon.timestampLocal);
          // La plus ancienne garde "complet", la plus récente devient "doublon"
          if (tsNouvelle <= tsExistante) {
            await tx.fiche.update({
              where: { id: doublon.id },
              data: { statut: 'doublon' },
            });
          } else {
            statut = 'doublon';
          }
        }

        // 3) Insertion
        const creee = await tx.fiche.create({
          data: {
            idLocal: fiche.id_local,
            type: fiche.type,
            commercialId,
            timestampLocal: new Date(fiche.timestamp_local),
            syncedAt: new Date(),
            statut,
            telephoneSujet: fiche.telephone_sujet,
            donnees: JSON.stringify(fiche.donnees),
          },
        });

        // 4) Photos attachées à cette fiche
        const photos = photosByFiche.get(fiche.id_local) ?? [];
        for (const photo of photos) {
          const fichierPath = savePhoto(fiche.id_local, photo.type_photo, photo.data_url);
          const taille = Buffer.byteLength(
            photo.data_url.split(',')[1] ?? '',
            'base64'
          );
          await tx.photo.create({
            data: {
              ficheId: creee.id,
              typePhoto: photo.type_photo,
              fichierPath,
              tailleOctets: photo.taille_octets ?? taille,
            },
          });
        }

        return {
          statut: statut === 'doublon' ? ('doublon' as const) : ('ok' as const),
          message:
            statut === 'doublon'
              ? `Doublon détecté (téléphone ${fiche.telephone_sujet} déjà enregistré)`
              : 'Fiche synchronisée',
        };
      });

      resultats.push({ id_local: fiche.id_local, ...resultat });
    } catch (err) {
      resultats.push({
        id_local: fiche.id_local,
        statut: 'erreur',
        message: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    }
  }

  return resultats;
}
