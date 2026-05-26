'use client'

import { PieChart, Pie, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'
import type { OETHStats } from '@/types'

interface JaugeOETHProps {
  stats: OETHStats
}

const STATUT_CONFIG = {
  conforme: { label: 'Conforme', variant: 'success' as const, color: '#2E7D32' },
  en_cours: { label: 'En cours', variant: 'warning' as const, color: '#BF5A00' },
  non_conforme: { label: 'Non conforme', variant: 'danger' as const, color: '#B71C1C' },
}

export function JaugeOETH({ stats }: JaugeOETHProps) {
  const config = STATUT_CONFIG[stats.statut]
  const taux = Math.min(stats.taux, 6)
  const data = [
    { value: taux },
    { value: Math.max(0, 6 - taux) },
  ]

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-52 h-52">
        <PieChart width={208} height={208}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={220}
              endAngle={-40}
              innerRadius={72}
              outerRadius={88}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={config.color} />
              <Cell fill="#E2E8F0" />
            </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[36px] font-bold text-[#1A1A2E] leading-none">
            {stats.taux.toFixed(1)}%
          </span>
          <span className="text-xs text-[#6B7280] mt-1">taux OETH</span>
        </div>
      </div>

      <Badge variant={config.variant} className="mt-3 text-sm px-3 py-1">
        {config.label}
      </Badge>

      <p className="text-sm text-[#6B7280] text-center mt-3">
        <span className="font-semibold text-[#1A1A2E]">{stats.ubTotales.toFixed(1)}</span> unités bénéficiaires{' '}
        sur <span className="font-semibold text-[#1A1A2E]">{stats.quotaTheorique.toFixed(1)}</span> requises
      </p>

      <div className="mt-4 w-full grid grid-cols-2 gap-3">
        <div className="bg-[#F8FAFC] rounded-lg p-3 text-center">
          <p className="text-[22px] font-bold text-[#1A1A2E]">{stats.ubRQTH.toFixed(2)}</p>
          <p className="text-xs text-[#6B7280]">UB BOETH</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-3 text-center">
          <p className="text-[22px] font-bold text-[#1A1A2E]">{stats.deductionESAT > 0 ? `−${Math.round(stats.deductionESAT).toLocaleString('fr-FR')} €` : '—'}</p>
          <p className="text-xs text-[#6B7280]">Déd. ESAT/EA est.</p>
        </div>
      </div>
    </div>
  )
}
