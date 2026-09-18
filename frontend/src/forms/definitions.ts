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

const OPERATEURS_MM = ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Autre'];
const TYPES_PIECE = ['CNI', 'Passeport', 'Permis de conduire', 'Attestation d\'identité', 'Autre'];

export const FORM_CHAUFFEUR: FormDef = {
  type: 'chauffeur',
  titre: 'Pré-enregistrement Chauffeur — DiddiGo',
  titreCourt: 'Chauffeur',
  sections: [
    {
      titre: 'Identité',
      fields: [
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'prenoms', label: 'Prénoms', type: 'text', required: true },
        { name: 'date_naissance', label: 'Date de naissance', type: 'date', required: true },
        { name: 'lieu_naissance', label: 'Lieu de naissance', type: 'text', required: true },
        { name: 'sexe', label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
        { name: 'nationalite', label: 'Nationalité', type: 'text', required: true },
        {
          name: 'situation_matrimoniale',
          label: 'Situation matrimoniale',
          type: 'select',
          options: ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'],
        },
        { name: 'adresse_residence', label: 'Adresse de résidence', type: 'text', required: true },
        { name: 'telephone_principal', label: 'Téléphone principal (Mobile Money possible)', type: 'tel', required: true },
        { name: 'telephone_secondaire', label: 'Téléphone secondaire', type: 'tel' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'type_piece', label: 'Type de pièce d\'identité', type: 'select', options: TYPES_PIECE },
        { name: 'numero_piece', label: 'N° de pièce d\'identité', type: 'text', required: true },
        { name: 'date_expiration_piece', label: 'Date d\'expiration de la pièce', type: 'date' },
        { name: 'anciennete_ville', label: 'Ancienneté dans la ville', type: 'text', placeholder: 'Ex. : 5 ans' },
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
          options: ['Moto', 'Voiture', 'Tricycle', 'Autre'],
        },
        { name: 'vehicule_marque', label: 'Marque', type: 'text', required: true },
        { name: 'vehicule_modele', label: 'Modèle', type: 'text', required: true },
        { name: 'vehicule_annee', label: 'Année', type: 'number', required: true },
        { name: 'immatriculation', label: 'Immatriculation', type: 'text', required: true },
        { name: 'vehicule_couleur', label: 'Couleur', type: 'text' },
        { name: 'nombre_places', label: 'Nombre de places', type: 'number' },
      ],
    },
    {
      titre: 'Documents réglementaires',
      fields: [
        { name: 'permis_numero', label: 'N° de permis', type: 'text', required: true },
        { name: 'permis_categorie', label: 'Catégorie du permis', type: 'text' },
        { name: 'permis_expiration', label: 'Date d\'expiration du permis', type: 'date' },
        { name: 'carte_grise_numero', label: 'N° carte grise', type: 'text' },
        { name: 'carte_pro_numero', label: 'N° carte professionnelle', type: 'text' },
        { name: 'assurance_compagnie', label: 'Assurance — compagnie', type: 'text' },
        { name: 'assurance_numero', label: 'Assurance — n° de police', type: 'text' },
        { name: 'assurance_expiration', label: 'Assurance — date d\'expiration', type: 'date' },
        { name: 'visite_technique_date', label: 'Date dernière visite technique', type: 'date' },
        { name: 'casier_judiciaire_numero', label: 'N° casier judiciaire', type: 'text' },
      ],
    },
    {
      titre: 'Paiement (Mobile Money)',
      fields: [
        { name: 'mm_operateur', label: 'Opérateur Mobile Money', type: 'select', options: OPERATEURS_MM },
        { name: 'mm_numero', label: 'Numéro Mobile Money', type: 'tel', required: true },
        { name: 'mm_nom_compte', label: 'Nom sur le compte', type: 'text' },
        { name: 'banque', label: 'Banque (optionnel)', type: 'text' },
        { name: 'rib', label: 'IBAN/RIB (optionnel)', type: 'text' },
      ],
    },
    {
      titre: 'Contact d\'urgence',
      fields: [
        { name: 'urgence_nom', label: 'Nom complet', type: 'text', required: true },
        { name: 'urgence_lien', label: 'Lien de parenté', type: 'text' },
        { name: 'urgence_telephone', label: 'Téléphone', type: 'tel', required: true },
      ],
    },
    {
      titre: 'Disponibilité',
      fields: [
        { name: 'zone_souhaitee', label: 'Zone souhaitée', type: 'text' },
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
  photos: [
    { key: 'photo_identite', label: 'Photo d\'identité' },
    { key: 'piece_identite', label: 'Pièce d\'identité' },
    { key: 'permis', label: 'Permis de conduire' },
    { key: 'carte_grise', label: 'Carte grise' },
    { key: 'assurance', label: 'Assurance' },
    { key: 'visite_technique', label: 'Visite technique' },
    { key: 'casier_judiciaire', label: 'Casier judiciaire' },
  ],
};

export const FORM_RESTAURANT: FormDef = {
  type: 'restaurant',
  titre: 'Pré-enregistrement Restaurant — DiddiFood',
  titreCourt: 'Restaurant',
  sections: [
    {
      titre: 'Identité de l\'établissement',
      fields: [
        { name: 'nom_enseigne', label: 'Nom commercial (enseigne)', type: 'text', required: true },
        { name: 'raison_sociale', label: 'Raison sociale', type: 'text' },
        { name: 'forme_juridique', label: 'Forme juridique', type: 'text' },
        { name: 'rccm', label: 'N° RCCM', type: 'text' },
        { name: 'compte_contribuable', label: 'N° compte contribuable', type: 'text' },
        { name: 'specialite', label: 'Type de cuisine / spécialité', type: 'text', required: true },
        { name: 'date_creation', label: 'Date de création', type: 'date' },
      ],
    },
    {
      titre: 'Localisation',
      fields: [
        { name: 'adresse', label: 'Adresse complète', type: 'text', required: true },
        { name: 'repere', label: 'Point de repère', type: 'text' },
        { name: 'gps', label: 'Coordonnées GPS', type: 'gps', hint: 'Détection automatique si le GPS est activé' },
      ],
    },
    {
      titre: 'Contact du gérant',
      fields: [
        { name: 'gerant_nom', label: 'Nom et prénoms du gérant', type: 'text', required: true },
        { name: 'gerant_fonction', label: 'Fonction', type: 'text' },
        { name: 'gerant_telephone', label: 'Téléphone principal', type: 'tel', required: true },
        { name: 'gerant_whatsapp', label: 'WhatsApp / secondaire', type: 'tel' },
        { name: 'gerant_email', label: 'Email', type: 'email' },
      ],
    },
    {
      titre: 'Horaires et offre',
      fields: [
        {
          name: 'jours_ouverture',
          label: 'Jours d\'ouverture',
          type: 'select',
          options: ['Lun – Sam', 'Lun – Dim', 'Sam – Dim', 'Tous les jours', 'Autre'],
        },
        { name: 'heure_ouverture', label: 'Heure d\'ouverture', type: 'time' },
        { name: 'heure_fermeture', label: 'Heure de fermeture', type: 'time' },
        { name: 'nombre_plats', label: 'Nombre de plats au menu', type: 'number' },
        { name: 'prix_min', label: 'Prix minimum (FCFA)', type: 'number' },
        { name: 'prix_max', label: 'Prix maximum (FCFA)', type: 'number' },
        { name: 'capacite_journaliere', label: 'Capacité de production / jour', type: 'number' },
      ],
    },
    {
      titre: 'Conformité sanitaire',
      fields: [
        { name: 'certificat_hygiene_numero', label: 'N° certificat d\'hygiène', type: 'text' },
        { name: 'certificat_hygiene_organisme', label: 'Organisme de délivrance', type: 'text' },
        { name: 'certificat_hygiene_date', label: 'Date de délivrance', type: 'date' },
      ],
    },
    {
      titre: 'Paiement (Mobile Money)',
      fields: [
        { name: 'mm_operateur', label: 'Opérateur Mobile Money', type: 'select', options: OPERATEURS_MM },
        { name: 'mm_numero', label: 'Numéro Mobile Money', type: 'tel', required: true },
        { name: 'mm_nom_compte', label: 'Nom sur le compte', type: 'text' },
        { name: 'banque', label: 'Banque (optionnel)', type: 'text' },
        { name: 'rib', label: 'IBAN/RIB (optionnel)', type: 'text' },
      ],
    },
  ],
  photos: [
    { key: 'identite_gerant', label: 'Pièce d\'identité du gérant' },
    { key: 'rccm', label: 'RCCM' },
    { key: 'certificat_hygiene', label: 'Certificat d\'hygiène' },
    { key: 'facade', label: 'Façade de l\'établissement' },
    { key: 'menu', label: 'Menu / carte' },
  ],
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
  restaurant: FORM_RESTAURANT,
  agent_commercial: FORM_AGENT,
};

/** Champ utilisé comme téléphone de dédoublonnage pour chaque type de fiche. */
export const CHAMP_TELEPHONE_SUJET: Record<TypeFiche, string> = {
  chauffeur: 'telephone_principal',
  restaurant: 'gerant_telephone',
  agent_commercial: 'telephone_principal',
};
