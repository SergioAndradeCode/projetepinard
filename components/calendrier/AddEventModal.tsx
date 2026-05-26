'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Building2, Globe } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCalendarEvent } from '@/app/(dashboard)/calendrier/actions'
import type { Establishment } from '@/types'

interface Props {
  establishments: Establishment[]
  onClose: () => void
}

export function AddEventModal({ establishments, onClose }: Props) {
  const router = useRouter()
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<'obligation' | 'evenement'>('evenement')
  const [etablissementId, setEtablissementId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim() || !date) return

    setLoading(true)
    setError('')
    const result = await createCalendarEvent({
      titre: titre.trim(),
      description: description.trim() || undefined,
      date_evenement: date,
      type,
      establishment_id: etablissementId || null,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A2E]">
            <CalendarDays className="w-5 h-5 text-[#1E4A8C]" />
            Ajouter une date
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Réunion CSE — Bilan OETH"
              required
              className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C]"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Type
            </label>
            <div className="flex gap-2">
              {([
                { value: 'evenement', label: 'Événement' },
                { value: 'obligation', label: 'Obligation' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    type === opt.value
                      ? 'bg-[#1E4A8C] text-white border-[#1E4A8C]'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1E4A8C]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Description <span className="text-[#9CA3AF] font-normal">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, contexte, rappels…"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C] resize-none"
            />
          </div>

          {/* Établissement */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Établissement <span className="text-[#9CA3AF] font-normal">(optionnel)</span>
            </label>
            <select
              value={etablissementId}
              onChange={(e) => setEtablissementId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/30 focus:border-[#1E4A8C] bg-white"
            >
              <option value="">
                Tous les établissements
              </option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}{e.is_headquarters ? ' (Siège)' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#9CA3AF] flex items-center gap-1">
              {etablissementId
                ? <><Building2 className="w-3 h-3" /> Visible uniquement pour cet établissement</>
                : <><Globe className="w-3 h-3" /> Visible pour toute l&apos;organisation</>
              }
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-[#F8FAFC] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !titre.trim() || !date}
              className="flex-1 py-2 text-sm font-medium bg-[#1E4A8C] text-white rounded-lg hover:bg-[#163d73] transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
