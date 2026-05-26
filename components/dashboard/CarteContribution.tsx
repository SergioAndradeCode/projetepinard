import { Info, TrendingDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { formatEuros } from '@/lib/utils'
import type { OETHStats } from '@/types'

interface CarteContributionProps {
  stats: OETHStats
}

export function CarteContribution({ stats }: CarteContributionProps) {
  const isConforme = stats.statut === 'conforme'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#6B7280]">Contribution AGEFIPH estimée</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-[#6B7280]" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Calculée sur la base du déficit d&apos;unités bénéficiaires.<br />
              Formule : (Quota - UB totales) × SMIC × coefficient</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isConforme ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-green-700" />
            </div>
            <p className="text-[28px] font-bold text-green-700">0 €</p>
            <p className="text-sm text-green-600 mt-1">Aucune contribution due</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[32px] font-bold text-[#B71C1C]">
              {formatEuros(stats.contribution)}
            </p>
            <p className="text-xs text-[#6B7280] mt-2">
              Si aucune action supplémentaire d&apos;ici fin d&apos;année
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-1.5">
        {stats.effectifEcap > 0 ? (
          <>
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Effectif brut</span>
              <span className="font-medium text-[#1A1A2E]">{stats.effectifBrut}</span>
            </div>
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Postes ECAP</span>
              <span className="font-medium text-[#1A1A2E]">− {stats.effectifEcap}</span>
            </div>
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Effectif d&apos;assujettissement</span>
              <span className="font-medium text-[#1A1A2E]">{stats.effectif}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-xs text-[#6B7280]">
            <span>Effectif d&apos;assujettissement</span>
            <span className="font-medium text-[#1A1A2E]">{stats.effectif}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>Quota théorique (6%)</span>
          <span className="font-medium text-[#1A1A2E]">{stats.quotaTheorique.toFixed(1)} UB</span>
        </div>
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>Coefficient de contribution</span>
          <span className="font-medium text-[#1A1A2E]">{stats.coefficient} h</span>
        </div>
      </div>
    </div>
  )
}
