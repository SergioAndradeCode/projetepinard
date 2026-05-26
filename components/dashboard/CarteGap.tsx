import { UserPlus, TrendingDown } from 'lucide-react'
import { formatEuros } from '@/lib/utils'
import type { OETHStats } from '@/types'

interface CarteGapProps {
  stats: OETHStats
}

export function CarteGap({ stats }: CarteGapProps) {
  const deficit = Math.max(0, stats.quotaTheorique - stats.ubRQTH)
  const recrutements = Math.ceil(deficit)
  const isConforme = deficit === 0

  if (isConforme) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-green-700" />
        </div>
        <p className="text-sm font-semibold text-[#2E7D32] text-center">Quota 6% atteint</p>
        <p className="text-xs text-[#6B7280] text-center">
          {stats.ubRQTH.toFixed(2)} UB pour {stats.quotaTheorique.toFixed(2)} requises
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-[#B71C1C]" />
        </div>
        <div>
          <p className="text-[26px] font-bold text-[#B71C1C] leading-none">{deficit.toFixed(2)}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">UB manquantes</p>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
        <div className="flex justify-between text-xs">
          <span className="text-[#6B7280]">UB actuelles</span>
          <span className="font-medium text-[#1A1A2E]">{stats.ubRQTH.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#6B7280]">Quota théorique (6%)</span>
          <span className="font-medium text-[#1A1A2E]">{stats.quotaTheorique.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs pt-1.5 border-t border-dashed border-[#E2E8F0]">
          <span className="text-[#6B7280]">Équivalent recrutements</span>
          <span className="font-semibold text-[#1E4A8C]">≈ {recrutements} RQTH</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#6B7280]">Contribution estimée</span>
          <span className="font-semibold text-[#B71C1C]">{formatEuros(stats.contribution)}</span>
        </div>
      </div>
    </div>
  )
}
