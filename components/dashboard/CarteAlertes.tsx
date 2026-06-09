import Link from 'next/link'
import { AlertTriangle, Clock, ChevronRight, CheckCircle } from 'lucide-react'
import { joursRestants, formatDate } from '@/lib/utils'
import type { RQTHEmployee } from '@/types'
import { getStatutRQTH } from '@/lib/oeth/calculs'

interface CarteAlertesProps {
  salaries: RQTHEmployee[]
}

export function CarteAlertes({ salaries }: CarteAlertesProps) {
  const alertes = salaries
    .filter((s) => {
      const statut = getStatutRQTH(s.date_fin, s.est_permanent)
      return statut === 'expire_bientot' || statut === 'expire'
    })
    .sort((a, b) => {
      if (!a.date_fin) return 1
      if (!b.date_fin) return -1
      return new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime()
    })
    .slice(0, 5)

  if (alertes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
        <p className="text-sm font-medium text-[#1A1A2E]">Aucune alerte prioritaire</p>
        <p className="text-xs text-[#6B7280] mt-1">Toutes les reconnaissances sont à jour</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alertes.map((s) => {
        const statut = getStatutRQTH(s.date_fin, s.est_permanent)
        const jours = s.date_fin ? joursRestants(s.date_fin) : null
        const isExpire = statut === 'expire'

        return (
          <Link
            key={s.id}
            href="/rqth"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isExpire ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              {isExpire
                ? <AlertTriangle className="w-4 h-4 text-[#B71C1C]" />
                : <Clock className="w-4 h-4 text-[#BF5A00]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">
                Renouvellement RQTH : {s.prenom ?? ''} {s.nom ?? ''}
              </p>
              <p className={`text-xs ${isExpire ? 'text-[#B71C1C]' : 'text-[#BF5A00]'}`}>
                {isExpire
                  ? `Expiré il y a ${Math.abs(jours!)} jours`
                  : jours !== null
                  ? `Expire dans ${jours} jours (${formatDate(s.date_fin!)})`
                  : 'Expiration imminente'
                }
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )
      })}
    </div>
  )
}
