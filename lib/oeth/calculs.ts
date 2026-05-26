import type { RQTHEmployee, ESATPurchase, OETHStats } from '@/types'

export const QUOTA_LEGAL = 0.06

// SMIC horaire au 31 décembre de chaque année de référence (valeur AGEFIPH)
export const SMIC_PAR_ANNEE: Record<number, number> = {
  2021: 10.48,
  2022: 10.93,
  2023: 11.27,
  2024: 11.88,
  2025: 11.88,
}
export function getSmicRef(annee: number): number {
  return SMIC_PAR_ANNEE[annee] ?? 11.88
}

export function getCoefficientContribution(effectif: number): 400 | 500 | 600 {
  if (effectif >= 750) return 600
  if (effectif >= 250) return 500
  return 400
}

// ─── Coefficient âge senior (BOETH 50 ans et plus = ×1,5 UB) ────────────────
// Règle légale OETH : les travailleurs handicapés ayant atteint 50 ans comptent
// pour 1,5 unité bénéficiaire au lieu de 1.

/**
 * Coefficient pour la DOETH : utilise l'âge au 31/12 de l'année de référence.
 * Si l'employé a 50 ans ou plus à un moment quelconque dans l'année, coefficient = 1,5.
 */
export function getCoeffAge(dateNaissance: string | null, annee: number): 1 | 1.5 {
  if (!dateNaissance) return 1
  const naissance = new Date(dateNaissance)
  if (isNaN(naissance.getTime())) return 1
  const ageFinAnnee = annee - naissance.getFullYear()
  return ageFinAnnee >= 50 ? 1.5 : 1
}

/**
 * Coefficient en temps réel (dashboard) : utilise l'âge exact à aujourd'hui.
 */
export function getCoeffAgeCourant(dateNaissance: string | null): 1 | 1.5 {
  if (!dateNaissance) return 1
  const naissance = new Date(dateNaissance)
  if (isNaN(naissance.getTime())) return 1
  const today = new Date()
  let age = today.getFullYear() - naissance.getFullYear()
  const anniversairePassé = today.getMonth() > naissance.getMonth() ||
    (today.getMonth() === naissance.getMonth() && today.getDate() >= naissance.getDate())
  if (!anniversairePassé) age--
  return age >= 50 ? 1.5 : 1
}

// ─── UB RQTH (temps réel — dashboard) ──────────────────────────────────────
// Chaque BOETH compte pour (taux_temps_travail / 100) × coeffAge UB.
// Les RQTH expirées (non permanentes, date_fin dans le passé) sont exclues.

export function calculerUBRQTH(salaries: RQTHEmployee[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return salaries
    .filter((s) => {
      if (s.est_permanent) return true
      if (!s.date_fin) return true
      return new Date(s.date_fin) >= today
    })
    .reduce((total, s) => {
      const coeff = getCoeffAgeCourant(s.date_naissance)
      return total + (s.taux_temps_travail ?? 100) / 100 * coeff
    }, 0)
}

export function compterRQTHActifs(salaries: RQTHEmployee[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return salaries.filter((s) => {
    if (s.est_permanent) return true
    if (!s.date_fin) return true
    return new Date(s.date_fin) >= today
  }).length
}

// ─── UB RQTH pour une année DOETH (proratisées par mois de présence) ─────────
// Formule légale : (nb_mois_présence_dans_l_année / 12) × (taux_temps_travail / 100)
// Un mois commencé compte entier. La présence est bornée à l'année de référence.

export function getMoisPresencePourAnnee(s: RQTHEmployee, annee: number): number {
  const yearStart = new Date(annee, 0, 1)
  const yearEnd = new Date(annee, 11, 31)
  const debut = new Date(s.date_debut)
  const fin = s.est_permanent || !s.date_fin ? new Date(annee + 50, 0, 1) : new Date(s.date_fin)
  if (debut > yearEnd || fin < yearStart) return 0
  const presenceStart = debut < yearStart ? yearStart : debut
  const presenceEnd = fin > yearEnd ? yearEnd : fin
  const mStart = presenceStart.getFullYear() * 12 + presenceStart.getMonth()
  const mEnd = presenceEnd.getFullYear() * 12 + presenceEnd.getMonth()
  return Math.min(mEnd - mStart + 1, 12)
}

export function getUBProratee(s: RQTHEmployee, annee: number): number {
  const nbMois = getMoisPresencePourAnnee(s, annee)
  if (nbMois === 0) return 0
  const coeff = getCoeffAge(s.date_naissance, annee)
  return (nbMois / 12) * ((s.taux_temps_travail ?? 100) / 100) * coeff
}

export function calculerUBRQTHPourAnnee(salaries: RQTHEmployee[], annee: number): number {
  return salaries.reduce((total, s) => total + getUBProratee(s, annee), 0)
}

export function filtrerSalariesPourAnnee(salaries: RQTHEmployee[], annee: number): RQTHEmployee[] {
  const yearStart = new Date(annee, 0, 1)
  const yearEnd = new Date(annee, 11, 31)
  return salaries.filter((s) => {
    const debut = new Date(s.date_debut)
    const fin = s.est_permanent || !s.date_fin ? new Date(annee + 50, 0, 1) : new Date(s.date_fin)
    return debut <= yearEnd && fin >= yearStart
  })
}

// ─── Déduction EA/ESAT/TIH ──────────────────────────────────────────────────
// Depuis la réforme 2020 (DSN), les achats EA/ESAT/TIH ne génèrent plus d'UB.
// Ils donnent droit à une DÉDUCTION monétaire de la contribution brute.
// Formule légale : 30 % × (Prix HT − coûts matières/sous-traitance/frais de vente)
// En pratique, le montant exact est fourni par l'attestation annuelle de l'EA/ESAT.
// Ici on estime à 30 % du montant HT total (conservateur, sans déduire les matières).

export function estimerDeductionESAT(achats: ESATPurchase[]): number {
  return achats.reduce((total, a) => total + a.montant_ht * 0.3, 0)
}

// ─── Calculs contribution ────────────────────────────────────────────────────

export function calculerTauxOETH(effectif: number, ubRQTH: number): number {
  if (effectif === 0) return 0
  return (ubRQTH / effectif) * 100
}

export function calculerContribution(
  effectif: number,
  ubRQTH: number,
  smicHoraire: number,
  coefficient: number
): number {
  const quotaTheorique = effectif * QUOTA_LEGAL
  const deficit = Math.max(0, quotaTheorique - ubRQTH)
  return deficit * smicHoraire * coefficient
}

export function getStatutRQTH(
  dateFin: string | null,
  estPermanent: boolean
): 'actif' | 'expire_bientot' | 'expire' {
  if (estPermanent || !dateFin) return 'actif'
  const fin = new Date(dateFin)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffJours = Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffJours < 0) return 'expire'
  if (diffJours <= 90) return 'expire_bientot'
  return 'actif'
}

export function calculerStats(
  salaries: RQTHEmployee[],
  achats: ESATPurchase[],
  effectifBrut: number,
  effectifEcap: number,
  smicHoraire: number,
): OETHStats {
  const effectif = Math.max(0, effectifBrut - effectifEcap)
  const coefficient = getCoefficientContribution(effectif)
  const ubRQTH = calculerUBRQTH(salaries)
  const nbRQTHActifs = compterRQTHActifs(salaries)
  const deductionESAT = estimerDeductionESAT(achats)
  const taux = calculerTauxOETH(effectif, ubRQTH)
  const quotaTheorique = effectif * QUOTA_LEGAL
  const contributionBrute = calculerContribution(effectif, ubRQTH, smicHoraire, coefficient)
  const contributionNette = Math.max(0, contributionBrute - deductionESAT)

  let statut: OETHStats['statut']
  if (taux >= 6) statut = 'conforme'
  else if (taux >= 3) statut = 'en_cours'
  else statut = 'non_conforme'

  return {
    taux,
    ubRQTH,
    nbRQTHActifs,
    deductionESAT,
    ubTotales: ubRQTH,
    quotaTheorique,
    contribution: contributionNette,
    contributionBrute,
    statut,
    effectif,
    effectifBrut,
    effectifEcap,
    coefficient,
  }
}

export function calculerTauxBudget(depenses: number, budget: number): number {
  if (budget === 0) return 0
  return (depenses / budget) * 100
}

