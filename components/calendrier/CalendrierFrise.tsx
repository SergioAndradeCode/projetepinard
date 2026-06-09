'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joursRestants } from '@/lib/utils'
import type { CalendarEvent, TypeEvenement, Establishment } from '@/types'
import { Calendar, Star, FileText, Trash2, Building2, Globe } from 'lucide-react'
import { deleteCalendarEvent } from '@/app/(dashboard)/calendrier/actions'

// ─── Génération des événements réglementaires annuels ────────────────────────

const NOMS_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function seephLundi(year: number): string {
  const nov1 = new Date(year, 10, 1)
  const dow = nov1.getDay() // 0=dim
  const daysToFirstMonday = dow === 1 ? 0 : (8 - dow) % 7
  const thirdMonday = 1 + daysToFirstMonday + 14
  return `${year}-11-${String(thirdMonday).padStart(2, '0')}`
}

interface EventItem {
  id: string
  titre: string
  description?: string | null
  date_evenement: string
  type: TypeEvenement
  est_global: boolean
  establishment_id?: string | null
}

function generateGlobalEvents(year: number): EventItem[] {
  const events: EventItem[] = []

  // DSN mensuelle — le 5 de chaque mois
  for (let m = 1; m <= 12; m++) {
    events.push({
      id: `dsn-${year}-${m}`,
      titre: `Vérification DSN : ${NOMS_MOIS[m - 1]}`,
      description: 'Contrôle mensuel des déclarations OETH dans la DSN',
      date_evenement: `${year}-${String(m).padStart(2, '0')}-05`,
      type: 'obligation',
      est_global: true,
    })
  }

  // Notification effectifs BOETH par l'Urssaf — 15 mars
  events.push({
    id: `notif-boeth-${year}`,
    titre: 'Notification effectifs BOETH : Urssaf',
    description: "L'Urssaf met à disposition les effectifs BOETH et l'effectif d'assujettissement de l'année N-1",
    date_evenement: `${year}-03-15`,
    type: 'obligation',
    est_global: true,
  })

  // Paiement contribution OETH : 5 mai (DSN d'avril)
  events.push({
    id: `doeth-${year}`,
    titre: 'DOETH annuelle, Paiement contribution OETH',
    description: "Déclaration et paiement de la contribution OETH (exercice N-1) via DSN d'avril, exigible le 5 ou 15 mai selon effectif",
    date_evenement: `${year}-05-05`,
    type: 'obligation',
    est_global: true,
  })

  // Bilan OETH : 15 décembre
  events.push({
    id: `bilan-${year}`,
    titre: 'Bilan annuel OETH : Dernière chance avant clôture',
    description: "Vérifiez et optimisez votre taux avant la clôture de l'exercice",
    date_evenement: `${year}-12-15`,
    type: 'obligation',
    est_global: true,
  })

  // SEEPH — 3ème lundi de novembre
  const seeph = seephLundi(year)
  events.push({
    id: `seeph-${year}`,
    titre: "SEEPH, Semaine Européenne pour l'Emploi des Personnes Handicapées",
    description: 'Semaine nationale de sensibilisation, organisez vos actions internes',
    date_evenement: seeph,
    type: 'evenement',
    est_global: true,
  })

  // DuoDay — jeudi de la semaine SEEPH
  const seephDate = new Date(seeph + 'T00:00:00')
  const duoday = new Date(seephDate)
  duoday.setDate(seephDate.getDate() + 3)
  events.push({
    id: `duoday-${year}`,
    titre: 'DuoDay, Jeudi de la SEEPH',
    description: "Un jeune en situation de handicap passe la journée avec un professionnel volontaire",
    date_evenement: duoday.toISOString().split('T')[0],
    type: 'evenement',
    est_global: true,
  })

  // Journée mondiale du handicap — 3 décembre
  events.push({
    id: `jmh-${year}`,
    titre: 'Journée mondiale du handicap',
    description: 'Journée internationale des personnes handicapées, ONU',
    date_evenement: `${year}-12-03`,
    type: 'evenement',
    est_global: true,
  })

  return events
}

// ─── Config visuelle ─────────────────────────────────────────────────────────

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
    icon: <Star className="w-3.5 h-3.5" />,
  },
}

const EVENEMENTS_PRIORITAIRES = ['SEEPH', 'DuoDay', 'Journée mondiale']

// ─── Composant ───────────────────────────────────────────────────────────────

interface Props {
  evenementsOrg: CalendarEvent[]
  establishments: Establishment[]
  canWrite: boolean
}

export function CalendrierFrise({ evenementsOrg, establishments, canWrite }: Props) {
  const router = useRouter()
  const today = new Date()
  const annee = today.getFullYear()
  const [deleting, setDeleting] = useState<string | null>(null)

  const etablissementMap = Object.fromEntries(establishments.map((e) => [e.id, e.name]))

  const globalEvents = generateGlobalEvents(annee)

  const orgItems: EventItem[] = evenementsOrg.map((e) => ({
    id: e.id,
    titre: e.titre,
    description: e.description,
    date_evenement: e.date_evenement,
    type: e.type,
    est_global: false,
    establishment_id: e.establishment_id,
  }))

  const tousEvenements = [...globalEvents, ...orgItems].sort(
    (a, b) => new Date(a.date_evenement).getTime() - new Date(b.date_evenement).getTime()
  )

  // Grouper par mois
  const parMois: Record<number, EventItem[]> = {}
  tousEvenements.forEach((e) => {
    const mois = new Date(e.date_evenement + 'T00:00:00').getMonth()
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

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteCalendarEvent(id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {moisAvecEvenements.map(({ mois, events }) => (
        <div key={mois}>
          <h2 className="text-[18px] font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1E4A8C] rounded-full" />
            {NOMS_MOIS[mois]} {annee}
          </h2>
          <div className="space-y-3">
            {events.map((event) => {
              const jours = joursRestants(event.date_evenement)
              const config = TYPE_CONFIG[event.type]
              const isPrioritaire = EVENEMENTS_PRIORITAIRES.some((p) => event.titre.includes(p))
              const isPasse = jours < 0
              const etablissementNom = event.establishment_id
                ? etablissementMap[event.establishment_id]
                : null

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
                      {new Date(event.date_evenement + 'T00:00:00').getDate()}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {NOMS_MOIS[mois].slice(0, 3).toLowerCase()}
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
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                      {etablissementNom && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-full px-2 py-0.5 font-medium">
                          <Building2 className="w-3 h-3" />
                          {etablissementNom}
                        </span>
                      )}
                      {!event.est_global && !etablissementNom && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-full px-2 py-0.5 font-medium">
                          <Globe className="w-3 h-3" />
                          Tous les établissements
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Jours restants + action */}
                  <div className="shrink-0 text-right flex flex-col items-end gap-2">
                    {isPasse ? (
                      <span className="text-xs text-[#6B7280]">Passé</span>
                    ) : jours === 0 ? (
                      <span className="text-xs font-bold text-[#B71C1C]">Aujourd&apos;hui</span>
                    ) : (
                      <div>
                        <p className={`text-sm font-bold ${jours <= 30 ? 'text-[#B71C1C]' : jours <= 90 ? 'text-[#BF5A00]' : 'text-[#6B7280]'}`}>
                          J-{jours}
                        </p>
                        <p className="text-xs text-[#6B7280]">jours</p>
                      </div>
                    )}
                    {canWrite && !event.est_global && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="p-1 rounded text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
