export type TypeFiche = 'chauffeur' | 'livreur' | 'restaurant' | 'agent_commercial';

export interface Commercial {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone: string;
  role: 'commercial' | 'admin';
}

/** Fiche stockée dans IndexedDB (et miroir serveur après sync) */
export interface FicheLocal {
  id_local: string;
  type: TypeFiche;
  commercial_id: string;
  timestamp_local: string; // ISO
  synced: number; // 0 = en attente, 1 = synchronisé (indexable par Dexie)
  statut: 'complet' | 'doublon' | 'valide';
  telephone_sujet: string;
  donnees: Record<string, unknown>;
}

/** Photo stockée dans IndexedDB (Blob compressé) */
export interface PhotoLocal {
  id?: number; // auto-incrémenté Dexie
  fiche_id_local: string;
  type_photo: string;
  blob: Blob;
  taille_octets: number;
  synced: number; // 0 = en attente, 1 = synchronisé
}

export const LIBELLES_TYPES: Record<TypeFiche, string> = {
  chauffeur: 'Chauffeur VTC (DiddiGo)',
  livreur: 'Livreur (DiddiSend)',
  restaurant: 'Restaurant (DiddiFood)',
  agent_commercial: 'Agent Commercial',
};
