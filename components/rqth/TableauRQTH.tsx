'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, AlertCircle, Loader2, FolderOpen, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BadgeStatut } from './BadgeStatut'
import { FormRQTH } from './FormRQTH'
import { DocumentsRQTH } from './DocumentsRQTH'
import { formatDate } from '@/lib/utils'
import { getStatutRQTH } from '@/lib/oeth/calculs'
import type { RQTHEmployee, Establishment } from '@/types'
import { LABEL_RECONNAISSANCE } from '@/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface TableauRQTHProps {
  salaries: RQTHEmployee[]
  organizationId: string
  onRefresh: () => void
  readonly?: boolean
  /** Liste des établissements de l'organisation — fournie uniquement pour les profils nationaux */
  etablissements?: Establishment[]
}

type Filtre = 'tous' | 'actif' | 'expire_bientot' | 'expire'

// Cache des comptages de documents par employé
type DocCounts = Record<string, number>

const LABEL_RECONNAISSANCE_COURT: Record<string, string> = {
  rqth: 'RQTH',
  pension_invalidite_2: 'Invalidité 2e cat.',
  pension_invalidite_3: 'Invalidité 3e cat.',
  aah: 'AAH',
  carte_mobilite_invalidite: 'CMI Invalidité',
  rente_at_mp: 'Rente AT/MP',
}

export function TableauRQTH({ salaries, organizationId, onRefresh, readonly = false, etablissements = [] }: TableauRQTHProps) {
  // Affiche la colonne Site uniquement si plusieurs établissements existent (profil national)
  const showSiteCol = etablissements.length > 1
  const etabById = Object.fromEntries(etablissements.map(e => [e.id, e]))
  const [editEmployee, setEditEmployee] = useState<RQTHEmployee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [docEmployee, setDocEmployee] = useState<RQTHEmployee | null>(null)
  const [docCounts, setDocCounts] = useState<DocCounts>({})
  const supabase = createClient()
  const router = useRouter()

  // Charge le nombre de documents par salarié
  useEffect(() => {
    if (salaries.length === 0) return
    const ids = salaries.map(s => s.id)
    supabase
      .from('rqth_documents')
      .select('rqth_employee_id')
      .in('rqth_employee_id', ids)
      .then(({ data }) => {
        const counts: DocCounts = {}
        data?.forEach(d => {
          counts[d.rqth_employee_id] = (counts[d.rqth_employee_id] ?? 0) + 1
        })
        setDocCounts(counts)
      })
  }, [salaries, supabase])

  const filtered = salaries
    .filter((s) => {
      if (filtre === 'tous') return true
      return getStatutRQTH(s.date_fin, s.est_permanent) === filtre
    })
    .sort((a, b) => {
      const ordre = { expire: 0, expire_bientot: 1, actif: 2 }
      return ordre[getStatutRQTH(a.date_fin, a.est_permanent)] - ordre[getStatutRQTH(b.date_fin, b.est_permanent)]
    })

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingDelete(true)
    const { error } = await supabase.from('rqth_employees').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Reconnaissance supprimée')
      onRefresh()
    }
    setDeleteId(null)
    setLoadingDelete(false)
  }

  if (salaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[#EBF2FA] rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-[#1E4A8C]" />
        </div>
        <p className="text-[16px] font-medium text-[#1A1A2E]">Aucun salarié RQTH enregistré</p>
        <p className="text-sm text-[#6B7280] mt-1">Ajoutez vos premiers salariés reconnus</p>
      </div>
    )
  }

  return (
    <>
      {/* Filtre */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-[#6B7280]">Filtrer :</span>
        <Select value={filtre} onValueChange={(v) => setFiltre(v as Filtre)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous ({salaries.length})</SelectItem>
            <SelectItem value="actif">
              Actifs ({salaries.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) === 'actif').length})
            </SelectItem>
            <SelectItem value="expire_bientot">
              Expire bientôt ({salaries.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) === 'expire_bientot').length})
            </SelectItem>
            <SelectItem value="expire">
              Expirés ({salaries.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) === 'expire').length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Collaborateur</th>
              {showSiteCol && <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Site</th>}
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Service / Poste</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Reconnaissance</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Temps</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Période</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Statut</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Docs</th>
              {!readonly && <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filtered.map((s) => (
              <tr key={s.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                {/* Collaborateur */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/rqth/${s.id}`)}
                    className="text-left group"
                  >
                    <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#1E4A8C] transition-colors">
                      {s.prenom} {s.nom}
                    </p>
                    {s.matricule && (
                      <p className="text-xs text-[#6B7280] mt-0.5">#{s.matricule}</p>
                    )}
                  </button>
                </td>

                {/* Site — profil national uniquement */}
                {showSiteCol && (
                  <td className="px-4 py-3">
                    {s.establishment_id && etabById[s.establishment_id] ? (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-[#EBF2FA] text-[#1E4A8C] whitespace-nowrap">
                        {etabById[s.establishment_id].name}
                        {etabById[s.establishment_id].is_headquarters && (
                          <span className="ml-1 text-[10px] opacity-60">(Siège)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-[#CBD5E1]">—</span>
                    )}
                  </td>
                )}

                {/* Service / Poste / Bâtiment */}
                <td className="px-4 py-3">
                  <div>
                    {s.service && <p className="text-sm text-[#1A1A2E]">{s.service}</p>}
                    {s.poste && <p className="text-xs text-[#6B7280] mt-0.5">{s.poste}</p>}
                    {s.batiment && <p className="text-xs text-[#6B7280] mt-0.5">{s.batiment}</p>}
                    {!s.service && !s.poste && !s.batiment && <span className="text-xs text-[#CBD5E1]">—</span>}
                  </div>
                </td>

                {/* Type reconnaissance */}
                <td className="px-4 py-3 text-sm text-[#6B7280]">
                  {LABEL_RECONNAISSANCE_COURT[s.type_reconnaissance] ?? LABEL_RECONNAISSANCE[s.type_reconnaissance]}
                </td>

                {/* Taux temps travail */}
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    s.taux_temps_travail < 100
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-[#EBF2FA] text-[#1E4A8C]'
                  }`}>
                    {s.taux_temps_travail}%
                  </span>
                </td>

                {/* Période */}
                <td className="px-4 py-3 text-sm text-[#6B7280]">
                  <p>{formatDate(s.date_debut)}</p>
                  <p className="text-xs mt-0.5">
                    {s.est_permanent
                      ? <span className="text-[#2E7D32] font-medium">Permanente</span>
                      : s.date_fin ? formatDate(s.date_fin) : '—'
                    }
                  </p>
                </td>

                {/* Statut */}
                <td className="px-4 py-3">
                  <BadgeStatut dateFin={s.date_fin} estPermanent={s.est_permanent} />
                </td>

                {/* Documents */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setDocEmployee(s)}
                    className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#EBF2FA] transition-colors group"
                    title="Voir les documents"
                  >
                    <FolderOpen className="w-4 h-4 text-[#6B7280] group-hover:text-[#1E4A8C]" />
                    {(docCounts[s.id] ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1E4A8C] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {docCounts[s.id] > 9 ? '9+' : docCounts[s.id]}
                      </span>
                    )}
                  </button>
                </td>

                {/* Actions */}
                {!readonly && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/rqth/${s.id}`)}
                        className="h-8 w-8 hover:text-[#1E4A8C] hover:bg-[#EBF2FA]"
                        title="Créer une action de maintien dans l'emploi"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditEmployee(s)} className="h-8 w-8" title="Modifier">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(s.id)}
                        className="h-8 w-8 hover:text-[#B71C1C] hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-[#1A1A2E]">{s.prenom} {s.nom}</p>
                {s.matricule && <p className="text-xs text-[#6B7280]">#{s.matricule}</p>}
                {showSiteCol && s.establishment_id && etabById[s.establishment_id] && (
                  <p className="text-xs text-[#1E4A8C] font-medium mt-0.5">
                    📍 {etabById[s.establishment_id].name}
                  </p>
                )}
                {(s.service || s.poste || s.batiment) && (
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {[s.service, s.poste, s.batiment].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <BadgeStatut dateFin={s.date_fin} estPermanent={s.est_permanent} />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-md text-[#6B7280]">
                {LABEL_RECONNAISSANCE_COURT[s.type_reconnaissance]}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                s.taux_temps_travail < 100 ? 'bg-orange-50 text-orange-700' : 'bg-[#EBF2FA] text-[#1E4A8C]'
              }`}>
                {s.taux_temps_travail}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-[#6B7280]">
                {formatDate(s.date_debut)} → {s.est_permanent ? 'Permanente' : s.date_fin ? formatDate(s.date_fin) : '—'}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setDocEmployee(s)}
                  className="relative h-7 w-7 flex items-center justify-center rounded hover:bg-[#EBF2FA] transition-colors"
                  title="Documents"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#6B7280]" />
                  {(docCounts[s.id] ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#1E4A8C] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {docCounts[s.id] > 9 ? '9+' : docCounts[s.id]}
                    </span>
                  )}
                </button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => router.push(`/rqth/${s.id}`)}
                  className="h-7 w-7 hover:text-[#1E4A8C] hover:bg-[#EBF2FA]"
                  title="Créer une action de maintien"
                >
                  <Heart className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditEmployee(s)} className="h-7 w-7">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="h-7 w-7 hover:text-[#B71C1C]">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel documents */}
      {docEmployee && (
        <DocumentsRQTH
          open={true}
          employee={docEmployee}
          organizationId={organizationId}
          readonly={readonly}
          onClose={() => {
            // Rafraîchit le comptage à la fermeture
            supabase
              .from('rqth_documents')
              .select('rqth_employee_id')
              .eq('rqth_employee_id', docEmployee.id)
              .then(({ data }) => {
                setDocCounts(prev => ({
                  ...prev,
                  [docEmployee.id]: data?.length ?? 0,
                }))
              })
            setDocEmployee(null)
          }}
        />
      )}

      {/* Modal edit */}
      {editEmployee && (
        <FormRQTH
          open={true}
          onClose={() => setEditEmployee(null)}
          onSuccess={onRefresh}
          organizationId={organizationId}
          employee={editEmployee}
        />
      )}

      {/* Modal suppression */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la reconnaissance ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Cette action est irréversible. La reconnaissance sera définitivement supprimée.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loadingDelete}>
              {loadingDelete && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
