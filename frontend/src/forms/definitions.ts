import type { TypeFiche } from '../types';

export type FieldType =
  | 'text'
  | 'tel'
  | 'email'
  | 'date'
  | 'time'
  | 'number'
  | 'select'
  | 'textarea'
  | 'gps';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
}

export interface SectionDef {
  titre: string;
  fields: FieldDef[];
}

export interface PhotoSlot {
  key: string;
  label: string;
}

export interface FormDef {
  type: TypeFiche;
  titre: string;
  titreCourt: string;
  sections: SectionDef[];
  photos: PhotoSlot[];
}

const TYPES_PIECE = ['CNI', 'Passeport', 'Permis de conduire', 'Attestation d\'identité', 'Autre'];
const ZONES = ['Abidjan - Cocody', 'Abidjan - Deux-Plateaux', 'Abidjan - Marcory', 'Abidjan - Treichville', 'Abidjan - Yopougon', 'Abidjan - Abobo', 'Abidjan - Adjamé', 'Abidjan - Koumassi', 'Autre'];

// Phase 1 — RECENSEMENT uniquement : identité + véhicule + zone.
// Documents et photos seront collectés en phase 2 (candidat retenu).
export const FORM_CHAUFFEUR: FormDef = {
  type: 'chauffeur',
  titre: 'Recensement Chauffeur VTC — DiddiGo',
  titreCourt: 'Chauffeur',
  sections: [
    {
      titre: 'Identité',
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'prenoms', label: 'Prénoms', type: 'text', required: true },
        { name: 'sexe', label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
        { name: 'telephone_principal', label: 'Téléphone principal', type: 'tel', required: true },
        { name: 'telephone_secondaire', label: 'Téléphone secondaire', type: 'tel' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'adresse_residence', label: 'Quartier / résidence', type: 'text' },
      ],
    },
    {
      titre: 'Véhicule',
      fields: [
        { name: 'vehicule_modele', label: 'Modèle du véhicule', type: 'text' },
        {
          name: 'vehicule_proprietaire',
          label: 'Propriétaire du véhicule',
          type: 'select',
          options: ['Moi-même', 'Société', 'Location'],
        },
      ],
    },
    {
      titre: 'VÃ©hicule et zone',
      fields: [
        {
          name: 'zone_souhaitee',
          label: 'Zone souhaitée',
          type: 'select',
          options: ZONES,
        },
        {
          name: 'disponibilite',
          label: 'Disponibilité',
          type: 'select',
          options: ['Temps plein', 'Temps partiel', 'Horaires spécifiques'],
        },
        { name: 'disponibilite_details', label: 'Détails (horaires, jours…)', type: 'textarea' },
      ],
    },
  ],
  photos: [],
};

// Le parcours VTC tient sur deux écrans : identité, puis véhicule et zone.
FORM_CHAUFFEUR.sections = [
  FORM_CHAUFFEUR.sections[0],
  {
    titre: 'Véhicule et zone',
    fields: [
      ...FORM_CHAUFFEUR.sections[1].fields,
      ...FORM_CHAUFFEUR.sections[2].fields,
    ],
  },
];

// Phase 1 — RECENSEMENT livreur : identité + véhicule (moto/cargo) + zone de livraison.
export const FORM_LIVREUR: FormDef = {
  type: 'livreur',
  titre: 'Recensement Livreur — DiddiSend',
  titreCourt: 'Livreur',
  sections: [
    {
      titre: 'Identité',
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'prenoms', label: 'Prénoms', type: 'text', required: true },
        { name: 'sexe', label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
        { name: 'telephone_principal', label: 'Téléphone principal', type: 'tel', required: true },
        { name: 'telephone_secondaire', label: 'Téléphone secondaire', type: 'tel' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'adresse_residence', label: 'Quartier / résidence', type: 'text' },
      ],
    },
    {
      titre: 'Véhicule',
      fields: [
        {
          name: 'vehicule_type',
          label: 'Type de véhicule',
          type: 'select',
          required: true,
          options: ['Vélo', 'Van-cargo', 'Moto'],
        },
        { name: 'vehicule_modele', label: 'Modèle', type: 'text' },
        {
          name: 'vehicule_proprietaire',
          label: 'Propriétaire du véhicule',
          type: 'select',
          options: ['Moi-même', 'Société', 'Location'],
        },
      ],
    },
    {
      titre: 'Zone et disponibilité',
      fields: [
        { name: 'zone_livraison', label: 'Zone de livraison souhaitée', type: 'text' },
        {
          name: 'disponibilite',
          label: 'Disponibilité',
          type: 'select',
          options: ['Temps plein', 'Temps partiel', 'Horaires spécifiques'],
        },
        { name: 'disponibilite_details', label: 'Détails (horaires, jours…)', type: 'textarea' },
      ],
    },
  ],
  photos: [],
};

// Le parcours livreur tient également sur deux écrans.
FORM_LIVREUR.sections = [
  FORM_LIVREUR.sections[0],
  {
    titre: 'Véhicule et zone',
    fields: [
      ...FORM_LIVREUR.sections[1].fields,
      ...FORM_LIVREUR.sections[2].fields,
    ],
  },
];

export const FORM_RESTAURANT: FormDef = {
  type: 'restaurant',
  titre: 'Enregistrement Restaurant — DiddiFood',
  titreCourt: 'Restaurant',
  sections: [
    {
      titre: 'Identité de l\'établissement',
      fields: [
        { name: 'nom_enseigne', label: 'Nom commercial (enseigne)', type: 'text', required: true },
        { name: 'specialite', label: 'Type de cuisine / spécialité', type: 'text', required: true },
        { name: 'adresse', label: 'Adresse / quartier', type: 'text', required: true },
        { name: 'gps', label: 'Position du restaurant', type: 'gps', required: true, hint: 'Utilisez la position actuelle du téléphone' },
      ],
    },
    {
      titre: 'Contact du gérant',
      fields: [
        { name: 'gerant_nom', label: 'Nom et prénoms du gérant', type: 'text', required: true },
        { name: 'gerant_telephone', label: 'Téléphone principal', type: 'tel', required: true },
        { name: 'gerant_whatsapp', label: 'WhatsApp / secondaire', type: 'tel' },
        {
          name: 'jours_ouverture',
          label: 'Jours d\'ouverture',
          type: 'select',
          options: ['Lun – Sam', 'Lun – Dim', 'Sam – Dim', 'Tous les jours', 'Autre'],
        },
        { name: 'heure_ouverture', label: 'Heure d\'ouverture', type: 'time' },
        { name: 'heure_fermeture', label: 'Heure de fermeture', type: 'time' },
      ],
    },
    {
      titre: 'Menu et offre',
      fields: [
        { name: 'plats_signature', label: 'Plats ou spécialités proposés', type: 'textarea', required: true, placeholder: 'Ex. poulet braisé, attiéké, grillades…' },
        { name: 'nombre_plats', label: 'Nombre approximatif de plats', type: 'number' },
      ],
    },
  ],
  photos: [],
};

export const FORM_AGENT: FormDef = {
  type: 'agent_commercial',
  titre: 'Pré-enregistrement Agent Commercial',
  titreCourt: 'Agent Commercial',
  // Formulaire volontairement court : identité et contact suffisent pour le terrain.
  sections: [
    {
      titre: 'Identité',
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'prenoms', label: 'Prénoms', type: 'text', required: true },
        { name: 'date_naissance', label: 'Date de naissance', type: 'date' },
        { name: 'sexe', label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
        { name: 'adresse_residence', label: 'Adresse de résidence', type: 'text' },
        { name: 'telephone_principal', label: 'Téléphone principal', type: 'tel', required: true },
        { name: 'telephone_secondaire', label: 'Téléphone secondaire', type: 'tel' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'zone_souhaitee', label: 'Zone / commune souhaitée', type: 'text' },
        { name: 'piece_type', label: 'Type de pièce d\'identité', type: 'select', options: TYPES_PIECE },
        { name: 'piece_numero', label: 'N° de pièce d\'identité', type: 'text' },
      ],
    },
  ],
  photos: [
    { key: 'piece_identite', label: 'Pièce d\'identité' },
    { key: 'photo_identite', label: 'Photo d\'identité' },
  ],
};

export const FORM_DEFINITIONS: Record<TypeFiche, FormDef> = {
  chauffeur: FORM_CHAUFFEUR,
  livreur: FORM_LIVREUR,
  restaurant: FORM_RESTAURANT,
  agent_commercial: FORM_AGENT,
};

/** Champ utilisé comme téléphone de dédoublonnage pour chaque type de fiche. */
export const CHAMP_TELEPHONE_SUJET: Record<TypeFiche, string> = {
  chauffeur: 'telephone_principal',
  livreur: 'telephone_principal',
  restaurant: 'gerant_telephone',
  agent_commercial: 'telephone_principal',
};
