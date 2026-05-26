'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
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

function formatPrice(amount: number, cycle: BillingCycle) {
  if (amount === 0) return null
  const euros = Math.round(amount / 100)
  return { euros, note: cycle === 'annual_monthly' ? 'par mois, facturé annuellement' : 'par mois, sans engagement' }
}

export function TarifsGrid() {
  const [cycle, setCycle] = useState<BillingCycle>('annual_monthly')

  const planIds = Object.keys(PLANS) as PlanId[]

  return (
    <div className="space-y-10">

      {/* Toggle mensuel / annuel */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 gap-1">
          {(['annual_monthly', 'monthly'] as BillingCycle[]).map(key => (
            <button
              key={key}
              onClick={() => setCycle(key)}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                cycle === key
                  ? 'bg-white text-[#1E4A8C] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {key === 'annual_monthly' ? 'Annuel' : 'Mensuel'}
              {key === 'annual_monthly' && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                  −15%
                </span>
              )}
            </button>
          ))}
        </div>
        {cycle === 'annual_monthly' && (
          <p className="text-xs text-[#6B7280]">Engagement 12 mois · paiement mensuel · annulable avant renouvellement</p>
        )}
      </div>

      {/* Cartes plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {planIds.map((planId) => {
          const plan   = PLANS[planId]
          const meta   = PLAN_META[planId]
          const priceInfo = formatPrice(plan.prices[cycle].amount, cycle)
          const isCustom  = priceInfo === null

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
                {isCustom ? (
                  <div>
                    <p className="text-3xl font-black text-[#1A1A2E]">Sur mesure</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Tarif personnalisé selon vos besoins</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-[#1A1A2E]">{priceInfo.euros}</span>
                      <span className="text-base text-[#6B7280]">€</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{priceInfo.note}</p>
                    {cycle === 'annual_monthly' && (
                      <p className="text-[11px] text-green-600 font-medium mt-1">
                        Soit {Math.round(plan.prices.annual_monthly.amount / 100 * 12)} € / an
                        {' '}— économie de {Math.round((plan.prices.monthly.amount - plan.prices.annual_monthly.amount) / 100 * 12)} €
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="mb-6">
                {isCustom ? (
                  <a
                    href="mailto:contact@talenth.fr?subject=Offre Groupe Talenth"
                    className="flex items-center justify-center gap-2 bg-[#F8FAFC] text-[#1E4A8C] border border-[#E2E8F0] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#EBF2FA] transition-colors text-sm w-full"
                  >
                    Nous contacter
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
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
                )}
                {!isCustom && (
                  <p className="text-[10px] text-center text-[#9CA3AF] mt-1.5">Sans carte bancaire</p>
                )}
              </div>

              {/* Séparateur */}
              <div className="border-t border-[#E2E8F0] my-1" />

              {/* Fonctionnalités (toutes incluses) */}
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

      {/* Bas : réassurance */}
      <p className="text-center text-xs text-[#9CA3AF]">
        Toutes fonctionnalités incluses dans chaque plan · Données hébergées en France · Conformité RGPD
      </p>
    </div>
  )
}
