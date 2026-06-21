import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle, CalendarDays } from 'lucide-react'
import { joursRestants, formatDate } from '@/lib/utils'
import type { RQTHEmployee } from '@/types'
import { getStatutRQTH } from '@/lib/oeth/calculs'

interface CarteAlertesProps {
  salaries: RQTHEmployee[]
}

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function getLabelMois(key: string, today: Date): string {
  if (key === 'expire') return 'Expirees'
  const [year, month] = key.split('-').map(Number)
  const moisLabel = MOIS_FR[month - 1]
  const thisMonth = today.getMonth() + 1
  const thisYear = today.getFullYear()
  if (year === thisYear && month === thisMonth) return `Ce mois-ci - ${moisLabel} ${year}`
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1
  const nextYear = thisMonth === 12 ? thisYear + 1 : thisYear
  if (year === nextYear && month === nextMonth) return `Le mois prochain - ${moisLabel} ${year}`
  return `${moisLabel} ${year}`
}

export function CarteAlertes({ salaries }: CarteAlertesProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const alertes = salaries
    .filter(s => {
      const statut = getStatutRQTH(s.date_fin, s.est_permanent)
      return statut === 'expire_bientot' || statut === 'expire'
    })
    .sort((a, b) => {
      if (!a.date_fin) return 1
      if (!b.date_fin) return -1
      return new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime()
    })

  if (alertes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
        <p className="text-sm font-medium text-[#1A1A2E]">Aucune alerte prioritaire</p>
        <p className="text-xs text-[#6B7280] mt-1">Toutes les reconnaissances sont a jour</p>
      </div>
    )
  }

  // Groupement par mois
  const groups: Record<string, RQTHEmployee[]> = {}
  for (const s of alertes) {
    const statut = getStatutRQTH(s.date_fin, s.est_permanent)
    let key: string
    if (statut === 'expire') {
      key = 'expire'
    } else if (s.date_fin) {
      const d = new Date(s.date_fin)
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    } else {
      key = 'expire'
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }

  // Tri : expirees en premier, puis mois croissant
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'expire') return -1
    if (b === 'expire') return 1
    return a.localeCompare(b)
  })

  // Maximum 3 groupes affichés
  const visibleKeys = sortedKeys.slice(0, 3)
  const totalAlertes = alertes.length

  return (
    <div className="space-y-3">
      {visibleKeys.map((key, gi) => {
        const groupe = groups[key]
        const isExpire = key === 'expire'
        const visibles = groupe.slice(0, 2)
        const restant = groupe.length - visibles.length

        return (
          <div key={key} className={gi > 0 ? 'pt-2 border-t border-[#F0F4F8]' : ''}>
            {/* En-tete mois */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <CalendarDays className={`w-3 h-3 shrink-0 ${isExpire ? 'text-[#B71C1C]' : 'text-[#BF5A00]'}`} />
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isExpire ? 'text-[#B71C1C]' : 'text-[#BF5A00]'}`}>
                {getLabelMois(key, today)}
              </p>
              {groupe.length > 1 && (
                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isExpire ? 'bg-red-100 text-[#B71C1C]' : 'bg-orange-100 text-[#BF5A00]'
                }`}>
                  {groupe.length}
                </span>
              )}
            </div>

            {/* Salaries de ce mois */}
            <div className="space-y-0.5 pl-1">
              {visibles.map(s => {
                const statut = getStatutRQTH(s.date_fin, s.est_permanent)
                const jours = s.date_fin ? joursRestants(s.date_fin) : null
                const estExpire = statut === 'expire'

                return (
                  <Link
                    key={s.id}
                    href="/rqth"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      estExpire ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {estExpire
                        ? <AlertTriangle className="w-3 h-3 text-[#B71C1C]" />
                        : <Clock className="w-3 h-3 text-[#BF5A00]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A2E] truncate">
                        {s.prenom ?? ''} {s.nom ?? ''}
                      </p>
                      <p className={`text-[10px] ${estExpire ? 'text-[#B71C1C]' : 'text-[#BF5A00]'}`}>
                        {estExpire
                          ? `Expire il y a ${Math.abs(jours!)} j`
                          : jours !== null
                          ? `Dans ${jours} j (${formatDate(s.date_fin!)})`
                          : 'Expiration imminente'
                        }
                      </p>
                    </div>
                  </Link>
                )
              })}
              {restant > 0 && (
                <Link href="/rqth" className="block text-[10px] text-[#6B7280] hover:text-[#1E4A8C] pl-2 py-1">
                  +{restant} autre{restant > 1 ? 's' : ''} ce mois
                </Link>
              )}
            </div>
          </div>
        )
      })}

      {/* Pied : voir tout si plus de 3 groupes ou alertes cachees */}
      <div className="pt-1 border-t border-[#E2E8F0]">
        <Link href="/rqth" className="block text-center text-[10px] text-[#1E4A8C] hover:underline py-1">
          {sortedKeys.length > 3
            ? `Voir les ${totalAlertes} alertes →`
            : 'Gerer les reconnaissances →'
          }
        </Link>
      </div>
    </div>
  )
}
