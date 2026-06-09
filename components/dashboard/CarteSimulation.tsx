'use client'

import { useState } from 'react'
import { getCoefficientContribution } from '@/lib/oeth/calculs'

interface CarteSimulationProps {
  stats: {
    taux: number
    ubRQTH: number
    quotaTheorique: number
    contribution: number
    effectif: number
  }
  smicRef: number
}

function formatEuros(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val)
}

function formatPct(val: number): string {
  return val.toFixed(2) + ' %'
}

export function CarteSimulation({ stats, smicRef }: CarteSimulationProps) {
  const [nbBoeth, setNbBoeth] = useState(0)
  const [montantEsat, setMontantEsat] = useState('')
  const [accord, setAccord] = useState(false)

  // ── Calcul simulé ──────────────────────────────────────────────────────────
  const ubSimulees = stats.ubRQTH + nbBoeth // chaque BOETH temps plein = +1 UB
  const tauxSimule = stats.effectif > 0 ? (ubSimulees / stats.effectif) * 100 : 0
  const deficit = Math.max(0, stats.quotaTheorique - ubSimulees)
  const coefficient = getCoefficientContribution(stats.effectif)
  const contributionBruteSimulee = deficit * smicRef * coefficient

  // Déduction ESAT simulée : min(montant * 0.3, plafond 50 % contribution brute)
  const montantEsatNum =
    parseFloat(montantEsat.replace(/\s/g, '').replace(',', '.')) || 0
  const plafondDeduction = contributionBruteSimulee * 0.5
  const deductionEsatSimulee = Math.min(montantEsatNum * 0.3, plafondDeduction)

  // Réduction accord agréé : −10 % de la contribution brute
  const reductionAccord = accord ? contributionBruteSimulee * 0.1 : 0

  const contributionSimulee = Math.max(
    0,
    contributionBruteSimulee - deductionEsatSimulee - reductionAccord
  )
  const economie = stats.contribution - contributionSimulee
  const ecartTaux = tauxSimule - stats.taux
  const simulationActive = nbBoeth > 0 || montantEsatNum > 0 || accord

  function reset() {
    setNbBoeth(0)
    setMontantEsat('')
    setAccord(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Inputs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Input 1 : Recruter N BOETH */}
        <div className="rounded-xl p-4 border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Recruter des BOETH
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Temps plein, +1 UB par recrutement</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={20}
              value={nbBoeth}
              onChange={(e) => setNbBoeth(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#1E4A8C' }}
            />
            <input
              type="number"
              min={0}
              max={20}
              value={nbBoeth}
              onChange={(e) =>
                setNbBoeth(Math.max(0, Math.min(20, Number(e.target.value))))
              }
              className="w-14 text-center text-sm font-bold text-[#1A1A2E] border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4A8C]"
            />
          </div>
          <p className="text-xs text-[#1E4A8C] font-medium">
            {nbBoeth === 0
              ? 'Aucun recrutement simulé'
              : `+${nbBoeth} BOETH → +${nbBoeth} UB générées`}
          </p>
        </div>

        {/* Input 2 : Contrat ESAT/EA */}
        <div className="rounded-xl p-4 border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Signer un contrat ESAT / EA
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Déduction = 30 % du montant (plafond 50 %)
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex : 12 000"
              value={montantEsat}
              onChange={(e) => setMontantEsat(e.target.value)}
              className="w-full text-sm font-medium text-[#1A1A2E] border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4A8C] placeholder:text-[#CBD5E1]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
              €
            </span>
          </div>
          <p className="text-xs text-[#1E4A8C] font-medium">
            {montantEsatNum === 0
              ? 'Aucun achat ESAT/EA simulé'
              : `Déduction estimée : ${formatEuros(deductionEsatSimulee)}`}
          </p>
        </div>

        {/* Input 3 : Accord agréé */}
        <div className="rounded-xl p-4 border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Accord d&apos;entreprise agréé
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Réduction de 10 % de la contribution
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={accord}
            onClick={() => setAccord((v) => !v)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4A8C] ${
              accord ? 'bg-[#1E4A8C]' : 'bg-[#E2E8F0]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                accord ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <p className="text-xs text-[#1E4A8C] font-medium">
            {accord
              ? `Économie accord : ${formatEuros(reductionAccord)}`
              : 'Accord non activé'}
          </p>
        </div>
      </div>

      {/* ── Résultat avant / après ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-[#E2E8F0]">

          {/* Situation actuelle */}
          <div className="p-4 bg-[#F8FAFC]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
              Situation actuelle
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Taux OETH</p>
                <p className="text-2xl font-bold text-[#1A1A2E] leading-none mt-0.5">
                  {formatPct(stats.taux)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Contribution estimée</p>
                <p className="text-2xl font-bold text-[#B71C1C] leading-none mt-0.5">
                  {formatEuros(stats.contribution)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">UB générées</p>
                <p className="text-lg font-semibold text-[#1A1A2E] leading-none mt-0.5">
                  {stats.ubRQTH.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Après simulation */}
          <div className="p-4 bg-white">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
              Après simulation
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-[#6B7280]">Taux OETH</p>
                <p
                  className={`text-2xl font-bold leading-none mt-0.5 ${
                    !simulationActive
                      ? 'text-[#1A1A2E]'
                      : ecartTaux >= 0
                      ? 'text-[#2E7D32]'
                      : 'text-[#B71C1C]'
                  }`}
                >
                  {formatPct(tauxSimule)}
                  {simulationActive && ecartTaux !== 0 && (
                    <span className="text-sm font-medium ml-1">
                      ({ecartTaux >= 0 ? '+' : ''}
                      {ecartTaux.toFixed(2)} %)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">Contribution estimée</p>
                <p
                  className={`text-2xl font-bold leading-none mt-0.5 ${
                    !simulationActive
                      ? 'text-[#B71C1C]'
                      : economie >= 0
                      ? 'text-[#2E7D32]'
                      : 'text-[#B71C1C]'
                  }`}
                >
                  {formatEuros(contributionSimulee)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B7280]">UB générées</p>
                <p
                  className={`text-lg font-semibold leading-none mt-0.5 ${
                    nbBoeth > 0 ? 'text-[#2E7D32]' : 'text-[#1A1A2E]'
                  }`}
                >
                  {ubSimulees.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bilan économie */}
        <div
          className={`px-4 py-3 border-t border-[#E2E8F0] ${
            simulationActive && economie > 0
              ? 'bg-[#F0FDF4]'
              : simulationActive && economie < 0
              ? 'bg-[#FEF2F2]'
              : 'bg-[#F8FAFC]'
          }`}
        >
          {simulationActive ? (
            <>
              <p
                className={`text-sm font-semibold ${
                  economie >= 0 ? 'text-[#2E7D32]' : 'text-[#B71C1C]'
                }`}
              >
                {economie > 0
                  ? `Économie totale réalisée : ${formatEuros(economie)}`
                  : economie < 0
                  ? `Surcoût simulé : ${formatEuros(Math.abs(economie))}`
                  : 'Aucun impact sur la contribution'}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Avec ces actions, vous passeriez de{' '}
                <span className="font-medium text-[#1A1A2E]">{formatPct(stats.taux)}</span>{' '}
                à{' '}
                <span
                  className={`font-medium ${
                    ecartTaux >= 0 ? 'text-[#2E7D32]' : 'text-[#B71C1C]'
                  }`}
                >
                  {formatPct(tauxSimule)}
                </span>{' '}
               , contribution réduite de{' '}
                <span
                  className={`font-medium ${
                    economie >= 0 ? 'text-[#2E7D32]' : 'text-[#B71C1C]'
                  }`}
                >
                  {formatEuros(Math.abs(economie))}
                </span>
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#9CA3AF]">
              Ajustez les paramètres ci-dessus pour voir l&apos;impact sur votre situation OETH.
            </p>
          )}
        </div>
      </div>

      {/* Bouton réinitialiser */}
      {simulationActive && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="text-xs text-[#6B7280] hover:text-[#1A1A2E] border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-white hover:bg-[#F8FAFC] transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  )
}
