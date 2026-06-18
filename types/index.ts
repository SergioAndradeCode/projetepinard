export type UserRole = 'admin' | 'charge_site' | 'charge_mission' | 'lecteur'
export type OrgType = 'entreprise' | 'cabinet'

export type TypeContrat =
  | 'cdi'
  | 'cdd'
  | 'alternant'
  | 'stagiaire'
  | 'interimaire'
  | 'autre'

export const LABEL_TYPE_CONTRAT: Record<TypeContrat, string> = {
  cdi:        'CDI',
  cdd:        'CDD',
  alternant:  'Alternant (apprentissage / pro)',
  stagiaire:  'Stagiaire',
  interimaire:'Intérimaire',
  autre:      'Autre',
}

export type TypeReconnaissance =
  | 'rqth'
  | 'pension_invalidite_2'
  | 'pension_invalidite_3'
  | 'aah'
  | 'carte_mobilite_invalidite'
  | 'rente_at_mp'
export type StatutRQTH = 'actif' | 'expire_bientot' | 'expire'
export type TypeEvenement = 'obligation' | 'evenement' | 'alerte_rqth' | 'fin_contrat'
export type Recurrence = 'annuelle' | 'mensuelle'
export type BudgetCategorie =
  | 'esat_ea'
  | 'maintien_emploi'
  | 'sensibilisation'
  | 'communication'
  | 'formation'
  | 'prestations_externes'
  | 'autres'

export interface Organization {
  id: string
  name: string
  siret: string | null
  type: OrgType
  created_at: string
}

export interface Establishment {
  id: string
  organization_id: string
  name: string
  siret: string
  address: string | null
  is_headquarters: boolean
  effectif_brut: number
  effectif_ecap: number
  effectif_assujettissement: number
  smic_horaire_ref: number
  coefficient_contribution: number
  annee: number
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  establishment_id: string | null
  role: UserRole
  full_name: string | null
  created_at: string
}

export interface OETHSettings {
  id: string
  organization_id: string
  annee: number
  effectif_brut: number
  effectif_ecap: number
  effectif_assujettissement: number
  smic_horaire_ref: number
  coefficient_contribution: number
}

export interface RQTHEmployee {
  id: string
  organization_id: string
  establishment_id: string | null
  nom: string
  prenom: string
  matricule: string | null
  service: string | null
  poste: string | null
  batiment: string | null
  taux_temps_travail: number
  date_naissance: string | null
  type_reconnaissance: TypeReconnaissance
  type_contrat: TypeContrat
  date_debut: string
  date_fin: string | null
  est_permanent: boolean
  date_sortie_entreprise: string | null
  date_fin_contrat: string | null
  notes: string | null
  created_at: string
}

export type TypeDocument = 'rqth' | 'facture' | 'maintien_emploi' | 'autre'

export const LABEL_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  rqth:             'RQTH',
  facture:          'Facture',
  maintien_emploi:  'Maintien dans l\'emploi',
  autre:            'Autre',
}

export interface RQTHDocument {
  id: string
  rqth_employee_id: string
  organization_id: string
  nom_fichier: string
  type_document: TypeDocument
  storage_path: string
  taille: number | null
  uploaded_by: string | null
  created_at: string
}

export interface ESATPurchase {
  id: string
  organization_id: string
  establishment_id: string | null
  fournisseur: string
  montant_ht: number
  date_facture: string
  readonly ub_generees: number  // Colonne GENERATED ALWAYS AS côté PostgreSQL, lecture seule
  montant_attestation: number | null
  notes: string | null
  created_at: string
}

export interface BudgetAllocation {
  id: string
  organization_id: string
  establishment_id: string | null
  annee: number
  montant_total: number
}

export interface BudgetExpense {
  id: string
  organization_id: string
  establishment_id: string | null
  categorie: BudgetCategorie
  montant: number
  description: string
  date_depense: string
  facture_ref: string | null
  rqth_employee_id: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  organization_id: string | null
  establishment_id: string | null
  titre: string
  description: string | null
  date_evenement: string
  type: TypeEvenement
  recurrence: Recurrence | null
  est_global: boolean
  created_at: string
}

export interface OETHStats {
  taux: number
  ubRQTH: number
  nbRQTHActifs: number
  deductionESAT: number
  ubTotales: number
  quotaTheorique: number
  contribution: number
  contributionBrute: number
  statut: 'conforme' | 'en_cours' | 'non_conforme'
  effectif: number
  effectifBrut: number
  effectifEcap: number
  coefficient: number
}

export const LABEL_RECONNAISSANCE: Record<TypeReconnaissance, string> = {
  rqth: 'RQTH : Reconnaissance Qualité Travailleur Handicapé',
  pension_invalidite_2: "Pension d'invalidité 2e catégorie",
  pension_invalidite_3: "Pension d'invalidité 3e catégorie",
  aah: 'AAH : Allocation Adulte Handicapé',
  carte_mobilite_invalidite: 'Carte mobilité inclusion mention invalidité',
  rente_at_mp: 'Rente AT/MP ≥ 10%',
}

export const BUDGET_CATEGORIES_LABELS: Record<BudgetCategorie, string> = {
  esat_ea: 'Achats ESAT/EA',
  maintien_emploi: 'Maintien dans l\'emploi',
  sensibilisation: 'Sensibilisation',
  communication: 'Communication',
  formation: 'Formation',
  prestations_externes: 'Prestations externes',
  autres: 'Autres',
}

// ── Maintien dans l'emploi ────────────────────────────────────────────────────
export type TypeSituationMaintien =
  | 'at_mp'
  | 'maladie_longue'
  | 'inaptitude_partielle'
  | 'inaptitude_totale'
  | 'autre'

export type StatutMaintien = 'en_cours' | 'amenage' | 'reclasse' | 'resolu' | 'rupture'

export interface MaintienEmploi {
  id: string
  organization_id: string
  establishment_id: string | null
  rqth_employee_id: string | null
  prenom: string
  nom: string
  poste: string | null
  code_interne: string | null
  type_situation: TypeSituationMaintien
  date_debut_situation: string
  date_retour_prevue: string | null
  statut: StatutMaintien
  amenagements: string[] | null
  detail_amenagements: string | null
  medecin_travail_saisi: boolean
  sameth_saisi: boolean
  cap_emploi_saisi: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export const LABEL_TYPE_SITUATION: Record<TypeSituationMaintien, string> = {
  at_mp:                'AT/MP : Accident du travail / Maladie professionnelle',
  maladie_longue:       'Maladie longue durée',
  inaptitude_partielle: 'Inaptitude partielle',
  inaptitude_totale:    'Inaptitude totale',
  autre:                'Autre situation',
}

export const LABEL_STATUT_MAINTIEN: Record<StatutMaintien, string> = {
  en_cours: 'En cours',
  amenage:  'Poste aménagé',
  reclasse: 'Reclassé',
  resolu:   'Résolu',
  rupture:  'Rupture de contrat',
}

export const AMENAGEMENTS_OPTIONS = [
  { value: 'teletravail',   label: 'Télétravail étendu' },
  { value: 'horaires',      label: 'Aménagement des horaires' },
  { value: 'materiel',      label: 'Adaptation du matériel / poste ergonomique' },
  { value: 'reclassement',  label: 'Reconversion / reclassement interne' },
  { value: 'temps_partiel', label: 'Temps partiel thérapeutique' },
  { value: 'formation',     label: 'Formation / montée en compétences' },
  { value: 'autre',         label: 'Autre aménagement' },
] as const
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:          'Administrateur',
  charge_site:    'Référent(e) Handicap',
  charge_mission: 'Chargé(e) de Mission Handicap',
  lecteur:        'Lecteur',
}
