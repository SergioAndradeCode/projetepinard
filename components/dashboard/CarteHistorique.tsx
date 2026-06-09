'use client'

export interface AnneeHistorique {
  annee: number
  taux: number
  nbBoeth: number
  ubTotal: number
  conforme: boolean
}

interface CarteHistoriqueProps {
  donnees: AnneeHistorique[]
}

const TAUX_SEUIL = 6
const MAX_TAUX_AFFICHAGE = 10

export function CarteHistorique({ donnees }: CarteHistoriqueProps) {
  if (donnees.length === 0) {
    return (
      <p className="text-sm text-[#6B7280] text-center py-6">
        Aucune donnée historique disponible, les années sans BOETH enregistrés n&apos;apparaissent pas.
      </p>
    )
  }

  const seuilPct = (TAUX_SEUIL / MAX_TAUX_AFFICHAGE) * 100

  return (
    <div className="flex flex-col gap-6">

      {/* ── Graphique en barres CSS ───────────────────────────────────── */}
      <div>
        <div className="flex items-end gap-4 relative" style={{ height: '140px' }}>

          {/* Ligne seuil 6% */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-[#1E4A8C] opacity-40 z-10 pointer-events-none"
            style={{ bottom: `${seuilPct}%` }}
          >
            <span className="absolute -top-5 right-0 text-[10px] font-semibold text-[#1E4A8C] opacity-70 select-none">
              Seuil 6%
            </span>
          </div>

          {donnees.map((d) => {
            const hauteurPct = Math.min((d.taux / MAX_TAUX_AFFICHAGE) * 100, 100)
            const couleur = d.conforme ? '#2E7D32' : '#B71C1C'
            return (
              <div
                key={d.annee}
                className="group flex-1 flex flex-col items-center gap-1 h-full justify-end relative"
              >
                {/* Tooltip hover */}
                <div
                  className="hidden group-hover:flex absolute z-20 flex-col items-center pointer-events-none"
                  style={{ bottom: `calc(${hauteurPct}% + 28px)` }}
                >
                  <div className="bg-[#1A1A2E] text-white text-[11px] rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                    <span className="font-bold">{d.taux.toFixed(2)}%</span>
                    <span className="text-[#A0AEC0] ml-1">· {d.nbBoeth} BOETH · {d.ubTotal.toFixed(1)} UB</span>
                  </div>
                  <div className="w-2 h-2 bg-[#1A1A2E] rotate-45 -mt-1" />
                </div>

                {/* Valeur */}
                <span className="text-[11px] font-bold mb-0.5" style={{ color: couleur }}>
                  {d.taux.toFixed(1)}%
                </span>

                {/* Barre */}
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(hauteurPct, 3)}%`,
                    backgroundColor: couleur,
                    boxShadow: `0 2px 8px ${couleur}40`,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Labels années */}
        <div className="flex gap-4 mt-2">
          {donnees.map((d) => (
            <div key={d.annee} className="flex-1 text-center">
              <span className="text-[12px] font-semibold text-[#4A5568]">{d.annee}</span>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mt-3 justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#2E7D32]" />
            <span className="text-[10px] text-[#6B7280]">Conforme (≥ 6%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#B71C1C]" />
            <span className="text-[10px] text-[#6B7280]">Non conforme (&lt; 6%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 border-t-2 border-dashed border-[#1E4A8C] opacity-60" />
            <span className="text-[10px] text-[#6B7280]">Seuil légal</span>
          </div>
        </div>
      </div>

      {/* ── Tableau récapitulatif ─────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              {['Année', 'Taux OETH', 'BOETH actifs', 'UB', 'Statut'].map(h => (
                <th key={h} className={`text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide pb-2 ${h === 'Année' ? 'text-left pr-4' : h === 'Statut' ? 'text-center pl-4' : 'text-right px-4'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donnees.map((d, i) => (
              <tr key={d.annee} className={`border-b border-[#F1F5F9] ${i % 2 !== 0 ? 'bg-[#FAFBFC]' : ''}`}>
                <td className="py-2.5 pr-4 font-semibold text-[#1A1A2E]">{d.annee}</td>
                <td className="py-2.5 px-4 text-right">
                  <span className="font-bold text-base" style={{ color: d.conforme ? '#2E7D32' : '#B71C1C' }}>
                    {d.taux.toFixed(2)}%
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-[#1A1A2E]">{d.nbBoeth}</td>
                <td className="py-2.5 px-4 text-right font-medium text-[#1A1A2E]">{d.ubTotal.toFixed(2)}</td>
                <td className="py-2.5 pl-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    d.conforme ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#B71C1C]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${d.conforme ? 'bg-[#2E7D32]' : 'bg-[#B71C1C]'}`} />
                    {d.conforme ? 'Conforme' : 'Non conforme'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
