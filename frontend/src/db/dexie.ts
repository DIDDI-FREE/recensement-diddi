import Dexie, { type Table } from 'dexie';
import type { FicheLocal, PhotoLocal } from '../types';

/**
 * Base IndexedDB locale (offline-first).
 * - fiches : une ligne par fiche saisie, flag `synced` basculé après push serveur
 * - photos : blobs compressés, liées par fiche_id_local
 */
export class DiddiDB extends Dexie {
  fiches!: Table<FicheLocal, string>;
  photos!: Table<PhotoLocal, number>;

  constructor() {
    super('diddifree-registration');
    this.version(1).stores({
      fiches: 'id_local, type, statut, synced, timestamp_local, telephone_sujet',
      photos: '++id, fiche_id_local, [fiche_id_local+type_photo], synced',
    });
  }
}

export const db = new DiddiDB();
