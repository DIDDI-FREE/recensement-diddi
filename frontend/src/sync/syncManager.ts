import { db } from '../db/dexie';
import { api, getToken } from '../utils/api';
import { blobVersDataUrl } from '../utils/image';

interface SyncResultat {
  id_local: string;
  statut: 'ok' | 'doublon' | 'erreur';
  message: string;
}

let syncEnCours = false;

/**
 * Nombre de fiches en attente de synchronisation.
 */
export async function compterEnAttente(): Promise<number> {
  return db.fiches.where('synced').equals(0).count();
}

/**
 * Pousse toutes les fiches non synchronisées vers POST /api/sync.
 * - Retourne le nombre de fiches synchronisées.
 * - Met à jour les flags `synced` et les statuts (doublon détecté, etc.).
 * - Ne fait rien si hors-ligne ou déjà en cours.
 */
export async function synchroniser(): Promise<number> {
  if (syncEnCours) return 0;
  if (!navigator.onLine || !getToken()) return 0;

  syncEnCours = true;
  try {
    const fiches = await db.fiches.where('synced').equals(0).toArray();
    if (fiches.length === 0) return 0;

    // Construit le batch : fiches + photos encodées en data URL
    const payloadFiches = fiches.map((f) => ({
      id_local: f.id_local,
      type: f.type,
      timestamp_local: f.timestamp_local,
      telephone_sujet: f.telephone_sujet,
      donnees: f.donnees,
      statut: 'complet' as const,
    }));

    const photosLocales = await db.photos.where('synced').equals(0).toArray();
    const payloadPhotos = await Promise.all(
      photosLocales.map(async (p) => ({
        fiche_id_local: p.fiche_id_local,
        type_photo: p.type_photo,
        data_url: await blobVersDataUrl(p.blob),
        taille_octets: p.taille_octets,
      }))
    );

    const reponse = await api<{ resultats: SyncResultat[] }>('/sync', {
      method: 'POST',
      body: { fiches: payloadFiches, photos: payloadPhotos },
    });

    // Applique les résultats
    for (const r of reponse.resultats) {
      if (r.statut === 'erreur') continue; // reste en attente, retenté au prochain passage
      await db.fiches.update(r.id_local, {
        synced: 1,
        statut: r.statut === 'doublon' ? 'doublon' : 'complet',
      });
    }
    const idsOk = new Set(
      reponse.resultats.filter((r) => r.statut !== 'erreur').map((r) => r.id_local)
    );
    await db.photos.where('synced').equals(0).modify((p) => {
      if (idsOk.has(p.fiche_id_local)) p.synced = 1;
    });

    return idsOk.size;
  } finally {
    syncEnCours = false;
  }
}

/**
 * Démarre la synchronisation automatique :
 * - au retour du réseau (événement `online`)
 * - par polling régulier (toutes les 30 s) — fallback si Background Sync absent
 */
export function demarrerSyncAuto(): () => void {
  const onOnline = () => {
    void synchroniser();
  };
  window.addEventListener('online', onOnline);
  const intervalle = window.setInterval(() => {
    if (navigator.onLine) void synchroniser();
  }, 30_000);

  // Premier essai au démarrage
  if (navigator.onLine) void synchroniser();

  return () => {
    window.removeEventListener('online', onOnline);
    window.clearInterval(intervalle);
  };
}
