'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail } from 'lucide-react'
import { PLANS, FEATURES, type PlanId, type BillingCycle } from '@/lib/plans'

const PLAN_META: Record<PlanId, {
  recommended?: boolean
  tagline: string
  seatsLabel: string
}> = {
  essentiel:    { tagline: 'Pour un référent unique',                seatsLabel: '1 utilisateur' },
  equipe:       { tagline: 'Pour une petite équipe mission handicap', seatsLabel: 'Jusqu\'à 5 utilisateurs', recommended: true },
  organisation: { tagline: 'ETI et grandes entreprises multi-sites', seatsLabel: 'Jusqu\'à 15 utilisateurs' },
  groupe:       { tagline: 'Grands groupes & cabinets RH',           seatsLabel: 'Utilisateurs illimités' },
}

type CycleOption = {
  cycle: BillingCycle
  label: string
  badge?: string
  sub: string
}

const CYCLE_OPTIONS: CycleOption[] = [
  {
    cycle: 'annual_upfront',
    label: 'Annuel — 1 paiement',
    badge: '−15%',
    sub: 'Une facture · 12 mois d\'accès · compatible bon de commande',
  },
  {
    cycle: 'annual_monthly',
    label: 'Annuel mensuel',
    badge: '−15%',
    sub: 'Engagement 12 mois · paiement mensuel · annulable avant renouvellement',
  },
  {
    cycle: 'monthly',
    label: 'Mensuel',
    sub: 'Sans engagement · résiliable à tout moment',
  },
]

// Plans affichés sous forme de cartes (les 3 tarifs standards)
const STANDARD_PLANS: PlanId[] = ['essentiel', 'equipe', 'organisation']

type PriceInfo = {
  main: number
  unit: string
  note: string
  saving: string | null
}

function formatPrice(planId: PlanId, cycle: BillingCycle): PriceInfo | null {
  const plan   = PLANS[planId]
  const amount = plan.prices[cycle].amount
  if (amount === 0) return null

  if (cycle === 'annual_upfront') {
    const totalEuros = Math.round(amount / 100)
    const perMonth   = Math.round(totalEuros / 12)
    const saving     = Math.round((plan.prices.monthly.amount - plan.prices.annual_monthly.amount) / 100 * 12)
    return {
      main:   totalEuros,
      unit:   '€ / an',
      note:   `Soit ${perMonth} €/mois — 1 seul paiement`,
      saving: `Économie de ${saving} € vs mensuel`,
    }
  }

  const euros = Math.round(amount / 100)

  if (cycle === 'annual_monthly') {
    const saving = Math.round((plan.prices.monthly.amount - amount) / 100 * 12)
    return {
      main:   euros,
      unit:   '€ / mois',
      note:   'Facturé chaque mois',
      saving: `Économie de ${saving} €/an`,
    }
  }

  return {
    main:   euros,
    unit:   '€ / mois',
    note:   'Sans engagement',
    saving: null,
  }
}

export function TarifsGrid() {
  const [cycle, setCycle] = useState<BillingCycle>('annual_upfront')

  const activeOpt = CYCLE_OPTIONS.find(o => o.cycle === cycle)!

  return (
    <div className="space-y-10">

      {/* Toggle 3 options */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 gap-1 flex-wrap justify-center">
          {CYCLE_OPTIONS.map(({ cycle: key, label, badge }) => (
            <button
              key={key}
              onClick={() => setCycle(key)}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                cycle === key
                  ? 'bg-white text-[#1E4A8C] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {label}
              {badge && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6B7280] text-center">{activeOpt.sub}</p>
        {cycle === 'annual_upfront' && (
          <p className="text-[11px] text-[#1E4A8C] bg-[#EBF2FA] px-3 py-1 rounded-full font-medium">
            Paiement par carte bancaire · virement ou bon de commande sur demande
          </p>
        )}
      </div>

      {/* 3 cartes plans standards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STANDARD_PLANS.map((planId) => {
          const plan      = PLANS[planId]
          const meta      = PLAN_META[planId]
          const priceInfo = formatPrice(planId, cycle)!  // jamais null pour les 3 standards

          return (
            <div
              key={planId}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                meta.recommended
                  ? 'border-[#1E4A8C] shadow-xl shadow-[#1E4A8C]/10 ring-2 ring-[#1E4A8C]/20 scale-[1.02]'
                  : 'border-[#E2E8F0] hover:border-[#1E4A8C]/30 hover:shadow-md bg-white'
              }`}
            >
              {meta.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow">
                    Recommandé
                  </span>
                </div>
              )}

              {/* Nom + tagline */}
              <div className="mb-5">
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1">{plan.name}</p>
                <p className="text-sm text-[#1A1A2E] font-semibold">{meta.seatsLabel}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{meta.tagline}</p>
              </div>

              {/* Prix */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#1A1A2E]">{priceInfo.main}</span>
                  <span className="text-base text-[#6B7280]">{priceInfo.unit}</span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{priceInfo.note}</p>
                {priceInfo.saving && (
                  <p className="text-[11px] text-green-600 font-medium mt-1">{priceInfo.saving}</p>
                )}
              </div>

              {/* CTA */}
              <div className="mb-6">
                <Link
                  href="/register"
                  className={`flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm w-full ${
                    meta.recommended
                      ? 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
                      : 'bg-[#EBF2FA] text-[#1E4A8C] hover:bg-[#d8e8f7]'
                  }`}
                >
                  Essai gratuit 10 jours
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-[10px] text-center text-[#9CA3AF] mt-1.5">Sans carte bancaire</p>
              </div>

              {/* Séparateur */}
              <div className="border-t border-[#E2E8F0] my-1" />

              {/* Fonctionnalités */}
              <ul className="space-y-2 mt-4 flex-1">
                {(Object.entries(FEATURES) as [keyof typeof FEATURES, string][]).map(([, label]) => (
                  <li key={label} className="flex items-start gap-2 text-xs text-[#1A1A2E]">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Bannière Groupe */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-[#EBF2FA] p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#1E4A8C] uppercase tracking-widest">Groupe</span>
            <span className="text-[10px] bg-[#1E4A8C] text-white px-2 py-0.5 rounded-full font-bold">Sur mesure</span>
          </div>
          <p className="text-sm font-semibold text-[#1A1A2E] mb-1">
            Plus de 15 utilisateurs · Groupes multi-entités · Cabinets RH
          </p>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Nombre d&apos;utilisateurs illimité · Toutes les fonctionnalités incluses · Accompagnement dédié ·
            Facturation adaptée à votre organisation (mensuel, annuel, bon de commande).
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <a
            href="mailto:contact@talenth.fr?subject=Offre Groupe Talenth — demande de devis"
            className="flex items-center gap-2 bg-[#1E4A8C] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#163870] transition-colors text-sm whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            Demander un devis
          </a>
          <p className="text-[10px] text-[#9CA3AF]">Réponse sous 24 h</p>
        </div>
      </div>

      {/* Réassurance */}
      <p className="text-center text-xs text-[#9CA3AF]">
        Toutes fonctionnalités incluses dans chaque plan · Données hébergées en France · Conformité RGPD
      </p>
    </div>
  )
}
