'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

type Cycle = 'annual' | 'monthly'

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    seats: '1 utilisateur',
    tagline: 'Idéal pour un référent unique',
    monthly: 39,
    annual: 33,
    highlight: false,
  },
  {
    id: 'equipe',
    name: 'Équipe',
    seats: 'Jusqu\'à 5 utilisateurs',
    tagline: 'Pour une petite équipe mission handicap',
    monthly: 89,
    annual: 75,
    highlight: true,
  },
  {
    id: 'organisation',
    name: 'Organisation',
    seats: 'Jusqu\'à 15 utilisateurs',
    tagline: 'ETI et grandes entreprises multi-sites',
    monthly: 179,
    annual: 152,
    highlight: false,
  },
  {
    id: 'groupe',
    name: 'Groupe',
    seats: 'Utilisateurs illimités',
    tagline: 'Grands groupes & cabinets RH',
    monthly: null,
    annual: null,
    highlight: false,
  },
]

const ALL_FEATURES = [
  'Dashboard OETH temps réel',
  'Suivi BOETH complet',
  'Maintien dans l\'emploi',
  'Achats ESAT/EA',
  'Multi-établissements',
  'Budget Mission Handicap',
  'Assistant DOETH',
  'Exports Excel',
  'Alertes reconnaissances',
  'Gestion multi-rôles',
]

export function LandingPricing() {
  const [cycle, setCycle] = useState<Cycle>('annual')

  return (
    <section className="py-20 border-t border-[#E2E8F0]">
      <div className="max-w-[1600px] mx-auto px-10">

        {/* En-tête */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">Tarifs</p>
          <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
            Un seul outil. Toutes les fonctionnalités.<br />Choisissez la taille de votre équipe.
          </h2>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
            Quel que soit votre plan, vous accédez à l&apos;intégralité de Talenth.
            Seul le nombre d&apos;utilisateurs diffère.
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 gap-1">
            <button
              onClick={() => setCycle('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                cycle === 'annual'
                  ? 'bg-white text-[#1E4A8C] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              Annuel
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">−15%</span>
            </button>
            <button
              onClick={() => setCycle('monthly')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                cycle === 'monthly'
                  ? 'bg-white text-[#1E4A8C] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              Mensuel
            </button>
          </div>
          {cycle === 'annual' && (
            <p className="text-xs text-[#6B7280]">Engagement 12 mois · paiement mensuel · annulable avant renouvellement</p>
          )}
        </div>

        {/* Bandeau "tout inclus" */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {ALL_FEATURES.map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 text-xs text-[#1E4A8C] bg-[#EBF2FA] border border-[#1E4A8C]/15 px-3 py-1.5 rounded-full font-medium">
              <CheckCircle className="w-3 h-3" />
              {f}
            </span>
          ))}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {PLANS.map(({ id, name, seats, tagline, monthly, annual, highlight }) => {
            const price = cycle === 'annual' ? annual : monthly
            const isCustom = price === null

            return (
              <div
                key={id}
                className={`relative rounded-2xl border flex flex-col transition-shadow ${
                  highlight
                    ? 'bg-white border-[#1E4A8C] shadow-2xl scale-[1.02]'
                    : 'bg-white border-[#E2E8F0] hover:shadow-md'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow">
                      Recommandé
                    </span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1">{name}</p>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{seats}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 mb-5">{tagline}</p>

                  {isCustom ? (
                    <div className="mb-1">
                      <p className="text-2xl font-black text-[#1A1A2E]">Sur mesure</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">Tarif personnalisé</p>
                    </div>
                  ) : (
                    <div className="mb-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-[#1A1A2E]">{price}</span>
                        <span className="text-base text-[#6B7280]">€</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {cycle === 'annual' ? 'par mois, facturé annuellement' : 'par mois, sans engagement'}
                      </p>
                      {cycle === 'annual' && monthly !== null && (
                        <p className="text-[11px] text-green-600 font-medium mt-1">
                          Économie de {(monthly - price) * 12} €/an vs mensuel
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-[#E2E8F0] my-5" />

                  <div className="mt-auto">
                    {isCustom ? (
                      <a
                        href="mailto:contact@talenth.fr?subject=Offre Groupe Talenth"
                        className="flex items-center justify-center gap-2 bg-[#F8FAFC] text-[#1E4A8C] border border-[#E2E8F0] font-semibold px-5 py-3 rounded-xl hover:bg-[#EBF2FA] transition-colors text-sm w-full"
                      >
                        Nous contacter
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <>
                        <Link
                          href="/register"
                          className={`flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl transition-colors text-sm w-full ${
                            highlight
                              ? 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
                              : 'bg-[#EBF2FA] text-[#1E4A8C] hover:bg-[#d8e8f7]'
                          }`}
                        >
                          Essai gratuit 10 jours
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <p className="text-[10px] text-center text-[#9CA3AF] mt-1.5">Sans carte bancaire</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bas de section */}
        <p className="text-center text-xs text-[#9CA3AF]">
          Sans carte bancaire · Données hébergées en France · Conformité RGPD
        </p>
      </div>
    </section>
  )
}
