'use client'

import { joursRestants, formatDateLong } from '@/lib/utils'
import type { CalendarEvent, TypeEvenement, RQTHEmployee } from '@/types'
import { Calendar, Star, AlertTriangle, FileText } from 'lucide-react'

interface CalendrierObligationProps {
  evenements: CalendarEvent[]
  salaries: RQTHEmployee[]
}

const TYPE_CONFIG: Record<TypeEvenement, { label: string; color: string; icon: React.ReactNode }> = {
  obligation: {
    label: 'Obligation légale',
    color: 'bg-[#EBF2FA] text-[#1E4A8C] border border-[#1E4A8C]/20',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  evenement: {
    label: 'Événement',
    color: 'bg-orange-50 text-[#BF5A00] border border-orange-200',
    icon: <Star className="w-3.5 h-3.5" />,
  },
  alerte_rqth: {
    label: 'Alerte RQTH',
    color: 'bg-red-50 text-[#B71C1C] border border-red-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  fin_contrat: {
    label: 'Fin de contrat',
    color: 'bg-orange-50 text-orange-700 border border-orange-200',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
}

const NOM_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface EventItem {
  id: string
  titre: string
  description?: string | null
  date_evenement: string
  type: TypeEvenement
  est_prioritaire?: boolean
}

export function CalendrierObligation({ evenements, salaries }: CalendrierObligationProps) {
  const today = new Date()
  const annee = today.getFullYear()

  // Générer les alertes RQTH dynamiques
  const alertesRQTH: EventItem[] = salaries
    .filter((s) => {
      if (s.est_permanent || !s.date_fin) return false
      const jours = joursRestants(s.date_fin)
      return jours >= 0 && jours <= 120
    })
    .map((s) => ({
      id: `rqth-${s.id}`,
      titre: `Renouvellement RQTH : ${s.prenom ?? ''} ${s.nom ?? ''}`.trim(),
      description: `Reconnaissance expirant le ${formatDateLong(s.date_fin!)}`,
      date_evenement: s.date_fin!,
      type: 'alerte_rqth' as TypeEvenement,
    }))

  const tousEvenements: EventItem[] = [
    ...evenements.map((e) => ({
      id: e.id,
      titre: e.titre,
      description: e.description,
      date_evenement: e.date_evenement,
      type: e.type,
      est_prioritaire: false,
    })),
    ...alertesRQTH,
  ].sort((a, b) => new Date(a.date_evenement).getTime() - new Date(b.date_evenement).getTime())

  // Grouper par mois
  const parMois: Record<number, EventItem[]> = {}
  tousEvenements.forEach((e) => {
    const mois = new Date(e.date_evenement).getMonth()
    if (!parMois[mois]) parMois[mois] = []
    parMois[mois].push(e)
  })

  const moisAvecEvenements = Object.entries(parMois)
    .map(([mois, events]) => ({ mois: parseInt(mois), events }))
    .sort((a, b) => a.mois - b.mois)

  if (moisAvecEvenements.length === 0) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Aucun événement à venir</p>
      </div>
    )
  }

  const EVENEMENTS_PRIORITAIRES = ['SEEPH', 'DuoDay', 'Journée mondiale']

  return (
    <div className="space-y-8">
      {moisAvecEvenements.map(({ mois, events }) => (
        <div key={mois}>
          <h2 className="text-[18px] font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1E4A8C] rounded-full" />
            {NOM_MOIS[mois]} {annee}
          </h2>
          <div className="space-y-3">
            {events.map((event) => {
              const jours = joursRestants(event.date_evenement)
              const config = TYPE_CONFIG[event.type]
              const isPrioritaire = EVENEMENTS_PRIORITAIRES.some((p) => event.titre.includes(p))
              const isPasse = jours < 0

              return (
                <div
                  key={event.id}
                  className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                    isPasse
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60'
                      : 'bg-white border-[#E2E8F0] hover:border-[#2E75B6]/30'
                  }`}
                >
                  {/* Date */}
                  <div className="shrink-0 text-center w-12">
                    <p className="text-[22px] font-bold text-[#1A1A2E] leading-none">
                      {new Date(event.date_evenement).getDate()}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {NOM_MOIS[new Date(event.date_evenement).getMonth()].slice(0, 3).toLowerCase()}
                    </p>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px bg-[#E2E8F0] shrink-0" />

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1A1A2E]">{event.titre}</p>
                      {isPrioritaire && (
                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-[#BF5A00] border border-orange-200 rounded-full px-2 py-0.5 font-medium shrink-0">
                          <Star className="w-3 h-3" />
                          À ne pas manquer
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-[#6B7280] mt-0.5">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Jours restants */}
                  <div className="shrink-0 text-right">
                    {isPasse ? (
                      <span className="text-xs text-[#6B7280]">Passé</span>
                    ) : jours === 0 ? (
                      <span className="text-xs font-bold text-[#B71C1C]">Aujourd&apos;hui</span>
                    ) : (
                      <div>
                        <p className={`text-sm font-bold ${jours <= 30 ? 'text-[#B71C1C]' : jours <= 90 ? 'text-[#BF5A00]' : 'text-[#6B7280]'}`}>
                          J{jours < 0 ? '' : '-'}{Math.abs(jours)}
                        </p>
                        <p className="text-xs text-[#6B7280]">jours</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
