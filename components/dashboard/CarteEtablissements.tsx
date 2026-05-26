import { Building2 } from 'lucide-react'
import type { Establishment, RQTHEmployee } from '@/types'
import { calculerUBRQTH } from '@/lib/oeth/calculs'

interface CarteEtablissementsProps {
  etablissements: Establishment[]
  salaries: RQTHEmployee[]
}

export function CarteEtablissements({ etablissements, salaries }: CarteEtablissementsProps) {
  const rows = etablissements.map(e => {
    const sal = salaries.filter(s => s.establishment_id === e.id)
    const ub = calculerUBRQTH(sal)
    const effectif = Math.max(0, (e.effectif_brut || e.effectif_assujettissement) - (e.effectif_ecap || 0))
    const taux = effectif > 0 ? (ub / effectif) * 100 : 0
    return { e, sal, ub, effectif, taux }
  }).sort((a, b) => (b.e.is_headquarters ? 1 : 0) - (a.e.is_headquarters ? 1 : 0))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-[#1E4A8C]" />
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Vue consolidée par site</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="text-left px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">Établissement</th>
              <th className="text-right px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">Effectif</th>
              <th className="text-right px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">BOETH</th>
              <th className="text-right px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">UB</th>
              <th className="text-right px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">Taux</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.map(({ e, sal, ub, effectif, taux }) => (
              <tr key={e.id} className="bg-white">
                <td className="px-3 py-2 font-medium text-[#1A1A2E]">
                  {e.name}
                  {e.is_headquarters && (
                    <span className="ml-1.5 text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-1.5 py-0.5 rounded">Siège</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-[#6B7280]">{effectif}</td>
                <td className="px-3 py-2 text-right text-[#6B7280]">{sal.length}</td>
                <td className="px-3 py-2 text-right font-medium text-[#1A1A2E]">{ub.toFixed(2)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${taux >= 6 ? 'text-[#2E7D32]' : taux >= 3 ? 'text-[#BF5A00]' : 'text-[#B71C1C]'}`}>
                  {taux.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
