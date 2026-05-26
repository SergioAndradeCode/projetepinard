'use client'

import { useState } from 'react'
import { CalendarDays, Users, Plus } from 'lucide-react'
import { CalendrierFrise } from './CalendrierFrise'
import { SuiviRQTH } from './SuiviRQTH'
import { AddEventModal } from './AddEventModal'
import { joursRestants } from '@/lib/utils'
import type { CalendarEvent, RQTHEmployee, Establishment } from '@/types'

type Tab = 'calendrier' | 'rqth'

interface Props {
  evenementsOrg: CalendarEvent[]
  salaries: RQTHEmployee[]
  establishments: Establishment[]
  canWrite: boolean
}

export function CalendrierWrapper({ evenementsOrg, salaries, establishments, canWrite }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('calendrier')
  const [showAddModal, setShowAddModal] = useState(false)

  const nbExpirantBientot = salaries.filter((s) => {
    if (s.est_permanent || !s.date_fin) return false
    const j = joursRestants(s.date_fin)
    return j >= 0 && j <= 90
  }).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Calendrier</h1>
        {canWrite && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E4A8C] text-white rounded-lg text-sm font-medium hover:bg-[#163d73] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une date
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('calendrier')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'calendrier'
              ? 'bg-white text-[#1E4A8C] shadow-sm'
              : 'text-[#6B7280] hover:text-[#1A1A2E]'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendrier réglementaire
        </button>
        <button
          onClick={() => setActiveTab('rqth')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rqth'
              ? 'bg-white text-[#1E4A8C] shadow-sm'
              : 'text-[#6B7280] hover:text-[#1A1A2E]'
          }`}
        >
          <Users className="w-4 h-4" />
          Suivi validité RQTH
          {nbExpirantBientot > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              {nbExpirantBientot}
            </span>
          )}
        </button>
      </div>

      {/* Contenu */}
      {activeTab === 'calendrier' ? (
        <CalendrierFrise
          evenementsOrg={evenementsOrg}
          establishments={establishments}
          canWrite={canWrite}
        />
      ) : (
        <SuiviRQTH salaries={salaries} establishments={establishments} />
      )}

      {showAddModal && (
        <AddEventModal
          establishments={establishments}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
