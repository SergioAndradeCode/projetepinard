import { LABEL_RECONNAISSANCE } from '@/types'
import type { RQTHEmployee } from '@/types'
import { calculerUBRQTH } from '@/lib/oeth/calculs'

interface CarteTypesReconnaissanceProps {
  salaries: RQTHEmployee[]
}

const COULEURS: Record<string, string> = {
  rqth: '#1E4A8C',
  pension_invalidite_2: '#7C3AED',
  pension_invalidite_3: '#5B21B6',
  aah: '#0369A1',
  carte_mobilite_invalidite: '#0891B2',
  rente_at_mp: '#0F766E',
}

export function CarteTypesReconnaissance({ salaries }: CarteTypesReconnaissanceProps) {
  const rows = Object.entries(LABEL_RECONNAISSANCE)
    .map(([type, label]) => {
      const sal = salaries.filter(s => s.type_reconnaissance === type)
      const actifs = sal.filter(s => {
        if (s.est_permanent || !s.date_fin) return true
        return new Date(s.date_fin) >= new Date(new Date().setHours(0, 0, 0, 0))
      })
      const ub = calculerUBRQTH(actifs)
      return { type, label: label.split(', ')[0], labelLong: label, nb: actifs.length, ub }
    })
    .filter(r => r.nb > 0)
    .sort((a, b) => b.nb - a.nb)

  const totalNb = rows.reduce((s, r) => s + r.nb, 0)

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#6B7280] text-center py-4">Aucun BOETH actif enregistré</p>
    )
  }

  return (
    <div className="space-y-2.5">
      {rows.map(({ type, label, nb, ub }) => {
        const pct = totalNb > 0 ? (nb / totalNb) * 100 : 0
        const color = COULEURS[type] ?? '#1E4A8C'
        return (
          <div key={type} className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-[#1A1A2E]">{label}</span>
              <span className="text-xs text-[#6B7280]">
                <span className="font-semibold text-[#1A1A2E]">{nb}</span> · {ub.toFixed(2)} UB
              </span>
            </div>
            <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-[#6B7280] pt-1">
        {totalNb} BOETH actif{totalNb > 1 ? 's' : ''} au total
      </p>
    </div>
  )
}
