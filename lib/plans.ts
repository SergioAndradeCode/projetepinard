export type PlanId = 'essentiel' | 'equipe' | 'organisation' | 'groupe'
export type BillingCycle = 'monthly' | 'annual_monthly'

// Toutes les fonctionnalités — identiques quel que soit le plan
// La différenciation est uniquement par le nombre d'utilisateurs
export const FEATURES = {
  dashboard_oeth:        'Tableau de bord OETH temps réel',
  rqth_management:       'Suivi des salariés BOETH',
  maintien_emploi:       'Suivi maintien dans l\'emploi',
  esat_purchases:        'Achats ESAT/EA (unités bénéficiaires)',
  multi_etablissements:  'Gestion multi-établissements',
  budget_mission:        'Budget Mission Handicap',
  doeth_assistant:       'Assistant DOETH + export',
  export_excel:          'Exports Excel',
  alerts_expiration:     'Alertes expiration reconnaissances',
  multi_roles:           'Gestion multi-rôles équipe',
} as const

export type FeatureKey = keyof typeof FEATURES

const ALL_FEATURES = Object.keys(FEATURES) as FeatureKey[]

export const PLANS = {
  essentiel: {
    name: 'Essentiel',
    maxEstablishments: -1,   // illimité — la limite est sur les utilisateurs
    maxUsers: 1,
    features: ALL_FEATURES,
    stripeProductId: process.env.STRIPE_PRODUCT_ESSENTIEL ?? '',
    prices: {
      monthly:        { amount: 3900,  stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL_MONTHLY ?? '' },
      annual_monthly: { amount: 3300,  stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL_ANNUAL_MONTHLY ?? '' },
    },
  },
  equipe: {
    name: 'Équipe',
    maxEstablishments: -1,
    maxUsers: 5,
    features: ALL_FEATURES,
    stripeProductId: process.env.STRIPE_PRODUCT_EQUIPE ?? '',
    prices: {
      monthly:        { amount: 8900,  stripePriceId: process.env.STRIPE_PRICE_EQUIPE_MONTHLY ?? '' },
      annual_monthly: { amount: 7500,  stripePriceId: process.env.STRIPE_PRICE_EQUIPE_ANNUAL_MONTHLY ?? '' },
    },
  },
  organisation: {
    name: 'Organisation',
    maxEstablishments: -1,
    maxUsers: 15,
    features: ALL_FEATURES,
    stripeProductId: process.env.STRIPE_PRODUCT_ORGANISATION ?? '',
    prices: {
      monthly:        { amount: 17900, stripePriceId: process.env.STRIPE_PRICE_ORGANISATION_MONTHLY ?? '' },
      annual_monthly: { amount: 15200, stripePriceId: process.env.STRIPE_PRICE_ORGANISATION_ANNUAL_MONTHLY ?? '' },
    },
  },
  // Groupe = sur mesure, pas de Stripe standard
  groupe: {
    name: 'Groupe',
    maxEstablishments: -1,
    maxUsers: -1,
    features: ALL_FEATURES,
    stripeProductId: process.env.STRIPE_PRODUCT_GROUPE ?? '',
    prices: {
      monthly:        { amount: 0, stripePriceId: '' },
      annual_monthly: { amount: 0, stripePriceId: '' },
    },
  },
} satisfies Record<PlanId, {
  name: string
  maxEstablishments: number
  maxUsers: number
  features: FeatureKey[]
  stripeProductId: string
  prices: Record<BillingCycle, { amount: number; stripePriceId: string }>
}>

export function planHasFeature(planId: PlanId | null | undefined, feature: FeatureKey): boolean {
  if (!planId) return false
  return (PLANS[planId]?.features as FeatureKey[]).includes(feature)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAddEstablishment(_planId: PlanId | null | undefined, _currentCount: number): boolean {
  // Tous les plans incluent les établissements illimités
  return true
}

export function canAddUser(planId: PlanId | null | undefined, currentCount: number): boolean {
  if (!planId) return false
  const max = PLANS[planId]?.maxUsers ?? 0
  return max === -1 || currentCount < max
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly:        'Mensuel',
  annual_monthly: 'Annuel (−15%)',
}
