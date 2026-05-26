import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import type { OETHStats } from '@/types'

interface BandeauStatutProps {
  stats: OETHStats
  annee: number
  nbSites: number
}

export function BandeauStatut({ stats, annee, nbSites }: BandeauStatutProps) {
  const { statut, taux, ubRQTH, quotaTheorique, effectif } = stats

  if (statut === 'conforme') {
    return (
      <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-green-50 border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#2E7D32] shrink-0" />
          <div>
            <p className="font-semibold text-[#2E7D32]">Taux OETH conforme — objectif 6% atteint</p>
            <p className="text-xs text-green-700 mt-0.5">
              {taux.toFixed(2)}% · {ubRQTH.toFixed(2)} UB pour {effectif} salariés{nbSites > 1 ? ` (${nbSites} établissements)` : ''}
            </p>
          </div>
        </div>
        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
          ✓ Conforme {annee}
        </span>
      </div>
    )
  }

  if (statut === 'en_cours') {
    const manquantes = Math.max(0, quotaTheorique - ubRQTH)
    return (
      <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#BF5A00] shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">En cours — taux entre 3% et 6%</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {taux.toFixed(2)}% · il manque <strong>{manquantes.toFixed(2)} UB</strong> pour atteindre l&apos;objectif
              {nbSites > 1 ? ` · ${nbSites} établissements consolidés` : ''}
            </p>
          </div>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
          {taux.toFixed(1)}% / 6%
        </span>
      </div>
    )
  }

  // non_conforme
  const manquantes = Math.max(0, quotaTheorique - ubRQTH)
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-red-50 border border-red-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-[#B71C1C] shrink-0" />
        <div>
          <p className="font-semibold text-[#B71C1C]">Taux OETH insuffisant — contribution AGEFIPH due</p>
          <p className="text-xs text-red-700 mt-0.5">
            {taux.toFixed(2)}% · il manque <strong>{manquantes.toFixed(2)} UB</strong> (≈ {Math.ceil(manquantes)} recrutement{Math.ceil(manquantes) > 1 ? 's' : ''} RQTH temps plein)
            {nbSites > 1 ? ` · ${nbSites} établissements consolidés` : ''}
          </p>
        </div>
      </div>
      <span className="text-xs bg-red-100 text-[#B71C1C] border border-red-200 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
        {taux.toFixed(1)}% / 6%
      </span>
    </div>
  )
}
