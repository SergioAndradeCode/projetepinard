'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, AlertCircle, Loader2, FolderOpen, Heart, Archive, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BadgeStatut } from './BadgeStatut'
import { FormRQTH } from './FormRQTH'
import { DocumentsRQTH } from './DocumentsRQTH'
import { formatDate } from '@/lib/utils'
import { getStatutRQTH } from '@/lib/oeth/calculs'
import type { RQTHEmployee, Establishment } from '@/types'
import { LABEL_RECONNAISSANCE, LABEL_TYPE_CONTRAT } from '@/types'
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
  /** Liste des établissements — fournie pour les profils nationaux */
  etablissements?: Establishment[]
}

type Filtre = 'tous' | 'actif' | 'expire_bientot' | 'expire'

type DocCounts = Record<string, number>

const LABEL_RECONNAISSANCE_COURT: Record<string, string> = {
  rqth: 'RQTH',
  pension_invalidite_2: 'Invalidité 2e cat.',
  pension_invalidite_3: 'Invalidité 3e cat.',
  aah: 'AAH',
  carte_mobilite_invalidite: 'CMI Invalidité',
  rente_at_mp: 'Rente AT/MP',
}

const BADGE_CONTRAT: Record<string, { bg: string; text: string; label: string }> = {
  cdi:        { bg: 'bg-[#EBF2FA]',     text: 'text-[#1E4A8C]',  label: 'CDI' },
  cdd:        { bg: 'bg-orange-50',      text: 'text-orange-700', label: 'CDD' },
  alternant:  { bg: 'bg-purple-50',      text: 'text-purple-700', label: 'Alternant' },
  stagiaire:  { bg: 'bg-gray-100',       text: 'text-gray-500',   label: 'Stagiaire' },
  interimaire:{ bg: 'bg-amber-50',       text: 'text-amber-700',  label: 'Intérimaire' },
  autre:      { bg: 'bg-[#F8FAFC]',      text: 'text-[#6B7280]',  label: 'Autre' },
}

export function TableauRQTH({ salaries, organizationId, onRefresh, readonly = false, etablissements = [] }: TableauRQTHProps) {
  const showSiteCol = etablissements.length > 1
  const etabById = Object.fromEntries(etablissements.map(e => [e.id, e]))

  const [editEmployee, setEditEmployee]   = useState<RQTHEmployee | null>(null)
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [archiveEmployee, setArchiveEmployee] = useState<RQTHEmployee | null>(null)
  const [archiveDate, setArchiveDate]     = useState(new Date().toISOString().slice(0, 10))
  const [filtre, setFiltre]               = useState<Filtre>('tous')
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [docEmployee, setDocEmployee]     = useState<RQTHEmployee | null>(null)
  const [docCounts, setDocCounts]         = useState<DocCounts>({})
  const supabase = createClient()
  const router   = useRouter()

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isArchived = (s: RQTHEmployee) =>
    !!s.date_sortie_entreprise && new Date(s.date_sortie_entreprise) < today

  const filtered = salaries
    .filter((s) => {
      if (filtre === 'tous') return true
      return getStatutRQTH(s.date_fin, s.est_permanent) === filtre
    })
    .sort((a, b) => {
      // Archivés en bas
      const aArchived = isArchived(a) ? 1 : 0
      const bArchived = isArchived(b) ? 1 : 0
      if (aArchived !== bArchived) return aArchived - bArchived
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
      toast.success('Reconnaissance supprimée définitivement')
      onRefresh()
    }
    setDeleteId(null)
    setLoadingDelete(false)
  }

  const handleArchive = async () => {
    if (!archiveEmployee) return
    setLoadingArchive(true)
    const { error } = await supabase
      .from('rqth_employees')
      .update({ date_sortie_entreprise: archiveDate })
      .eq('id', archiveEmployee.id)
    if (error) {
      toast.error("Erreur lors de l'archivage")
    } else {
      toast.success(`${archiveEmployee.prenom} ${archiveEmployee.nom} archive(e), presence conservee dans les calculs DOETH`)
      onRefresh()
    }
    setArchiveEmployee(null)
    setLoadingArchive(false)
  }

  const handleRestore = async (s: RQTHEmployee) => {
    const { error } = await supabase
      .from('rqth_employees')
      .update({ date_sortie_entreprise: null })
      .eq('id', s.id)
    if (error) {
      toast.error('Erreur lors de la restauration')
    } else {
      toast.success(`${s.prenom} ${s.nom} restauré(e) dans l'entreprise`)
      onRefresh()
    }
  }

  if (salaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[#EBF2FA] rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-[#1E4A8C]" />
        </div>
        <p className="text-[16px] font-medium text-[#1A1A2E]">Aucun salarié enregistré</p>
        <p className="text-sm text-[#6B7280] mt-1">Ajoutez vos premiers collaborateurs reconnus</p>
      </div>
    )
  }

  return (
    <>
      {/* Filtre statut RQTH */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-[#6B7280]">Statut RQTH :</span>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Contrat</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Service / Poste</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Reconnaissance</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Temps</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Période RQTH</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Statut</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Docs</th>
              {!readonly && <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filtered.map((s) => {
              const archived = isArchived(s)
              const badge = BADGE_CONTRAT[s.type_contrat ?? 'cdi'] ?? BADGE_CONTRAT.autre
              return (
                <tr key={s.id} className={`transition-colors ${archived ? 'bg-[#F8FAFC] opacity-70' : 'bg-white hover:bg-[#F8FAFC]'}`}>
                  {/* Collaborateur */}
                  <td className="px-4 py-3">
                    <button onClick={() => router.push(`/rqth/${s.id}`)} className="text-left group">
                      <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#1E4A8C] transition-colors">
                        {s.prenom} {s.nom}
                      </p>
                      {s.matricule && <p className="text-xs text-[#6B7280] mt-0.5">#{s.matricule}</p>}
                    </button>
                  </td>

                  {/* Site */}
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
                        <span className="text-xs text-[#CBD5E1]">-</span>
                      )}
                    </td>
                  )}

                  {/* Contrat */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    {s.date_fin_contrat && (() => {
                      const fin = new Date(s.date_fin_contrat + 'T00:00:00')
                      const depasse = fin < today && !isArchived(s)
                      return (
                        <p className={`text-[10px] mt-0.5 font-medium ${depasse ? 'text-red-600' : 'text-[#6B7280]'}`}>
                          {depasse ? 'Contrat termine ' : 'Fin '}
                          {fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      )
                    })()}
                  </td>

                  {/* Service / Poste */}
                  <td className="px-4 py-3">
                    <div>
                      {s.service && <p className="text-sm text-[#1A1A2E]">{s.service}</p>}
                      {s.poste && <p className="text-xs text-[#6B7280] mt-0.5">{s.poste}</p>}
                      {!s.service && !s.poste && !s.batiment && <span className="text-xs text-[#CBD5E1]">-</span>}
                    </div>
                  </td>

                  {/* Type reconnaissance */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {LABEL_RECONNAISSANCE_COURT[s.type_reconnaissance] ?? LABEL_RECONNAISSANCE[s.type_reconnaissance]}
                  </td>

                  {/* Taux temps travail */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      s.taux_temps_travail < 100 ? 'bg-orange-50 text-orange-700' : 'bg-[#EBF2FA] text-[#1E4A8C]'
                    }`}>
                      {s.taux_temps_travail}%
                    </span>
                  </td>

                  {/* Période RQTH */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    <p>{formatDate(s.date_debut)}</p>
                    <p className="text-xs mt-0.5">
                      {s.est_permanent
                        ? <span className="text-[#2E7D32] font-medium">Permanente</span>
                        : s.date_fin ? formatDate(s.date_fin) : '-'
                      }
                    </p>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3">
                    {archived ? (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Parti le {formatDate(s.date_sortie_entreprise!)}
                      </span>
                    ) : (
                      <BadgeStatut dateFin={s.date_fin} estPermanent={s.est_permanent} />
                    )}
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
                        {archived ? (
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleRestore(s)}
                            className="h-8 w-8 hover:text-[#19BF34] hover:bg-green-50"
                            title="Restaurer dans l'entreprise"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => router.push(`/rqth/${s.id}`)}
                              className="h-8 w-8 hover:text-[#1E4A8C] hover:bg-[#EBF2FA]"
                              title="Maintien dans l'emploi"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setEditEmployee(s)}
                              className="h-8 w-8"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => { setArchiveEmployee(s); setArchiveDate(new Date().toISOString().slice(0, 10)) }}
                              className="h-8 w-8 hover:text-[#D97706] hover:bg-amber-50"
                              title="Archiver le départ"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setDeleteId(s.id)}
                          className="h-8 w-8 hover:text-[#B71C1C] hover:bg-red-50"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => {
          const archived = isArchived(s)
          const badge = BADGE_CONTRAT[s.type_contrat ?? 'cdi'] ?? BADGE_CONTRAT.autre
          return (
            <div key={s.id} className={`rounded-xl border border-[#E2E8F0] p-4 ${archived ? 'bg-[#F8FAFC] opacity-70' : 'bg-white'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">{s.prenom} {s.nom}</p>
                  {s.matricule && <p className="text-xs text-[#6B7280]">#{s.matricule}</p>}
                  {showSiteCol && s.establishment_id && etabById[s.establishment_id] && (
                    <p className="text-xs text-[#1E4A8C] font-medium mt-0.5">
                      {etabById[s.establishment_id].name}
                    </p>
                  )}
                  {(s.service || s.poste) && (
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {[s.service, s.poste].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                {archived ? (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                    Parti le {formatDate(s.date_sortie_entreprise!)}
                  </span>
                ) : (
                  <BadgeStatut dateFin={s.date_fin} estPermanent={s.est_permanent} />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                  {badge.label}
                  {s.date_fin_contrat && (() => {
                    const fin = new Date(s.date_fin_contrat + 'T00:00:00')
                    const depasse = fin < today && !isArchived(s)
                    return (
                      <span className={`ml-1 font-normal ${depasse ? 'text-red-500' : 'opacity-70'}`}>
                        · {depasse ? 'fin ' : ''}{fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    )
                  })()}
                </span>
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
                  {formatDate(s.date_debut)} → {s.est_permanent ? 'Permanente' : s.date_fin ? formatDate(s.date_fin) : '-'}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDocEmployee(s)}
                    className="relative h-7 w-7 flex items-center justify-center rounded hover:bg-[#EBF2FA] transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#6B7280]" />
                    {(docCounts[s.id] ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#1E4A8C] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {docCounts[s.id] > 9 ? '9+' : docCounts[s.id]}
                      </span>
                    )}
                  </button>
                  {!readonly && (
                    <>
                      {archived ? (
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(s)} className="h-7 w-7 hover:text-[#19BF34]">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/rqth/${s.id}`)} className="h-7 w-7 hover:text-[#1E4A8C]">
                            <Heart className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditEmployee(s)} className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { setArchiveEmployee(s); setArchiveDate(new Date().toISOString().slice(0, 10)) }}
                            className="h-7 w-7 hover:text-[#D97706]">
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="h-7 w-7 hover:text-[#B71C1C]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Panel documents */}
      {docEmployee && (
        <DocumentsRQTH
          open={true}
          employee={docEmployee}
          organizationId={organizationId}
          readonly={readonly}
          onClose={() => {
            supabase
              .from('rqth_documents')
              .select('rqth_employee_id')
              .eq('rqth_employee_id', docEmployee.id)
              .then(({ data }) => {
                setDocCounts(prev => ({ ...prev, [docEmployee.id]: data?.length ?? 0 }))
              })
            setDocEmployee(null)
          }}
        />
      )}

      {/* Modal édition */}
      {editEmployee && (
        <FormRQTH
          open={true}
          onClose={() => setEditEmployee(null)}
          onSuccess={onRefresh}
          organizationId={organizationId}
          employee={editEmployee}
        />
      )}

      {/* Modal archivage */}
      <Dialog open={!!archiveEmployee} onOpenChange={(v) => !v && setArchiveEmployee(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archiver le départ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            <strong>{archiveEmployee?.prenom} {archiveEmployee?.nom}</strong> sera marqué(e) comme ayant quitté la structure.
            Sa présence restera comptabilisée dans les calculs DOETH des années où il/elle était présent(e).
            Vous pouvez le/la restaurer à tout moment en cas d&apos;erreur.
          </p>
          <div className="space-y-2 mt-1">
            <Label htmlFor="archive-date">Date de départ</Label>
            <Input
              id="archive-date"
              type="date"
              value={archiveDate}
              onChange={e => setArchiveDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setArchiveEmployee(null)}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white gap-2"
              onClick={handleArchive}
              disabled={loadingArchive || !archiveDate}
            >
              {loadingArchive && <Loader2 className="w-4 h-4 animate-spin" />}
              <Archive className="w-4 h-4" />
              Archiver le départ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal suppression définitive */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Suppression définitive</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Cette action est <strong>irréversible</strong>. La reconnaissance et tous ses documents seront définitivement supprimés,
            y compris dans les calculs DOETH historiques.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            Si ce salarié a quitté l&apos;entreprise, utilisez plutôt <strong>Archiver le départ</strong> (icône <Archive className="w-3 h-3 inline" />) pour conserver l&apos;historique DOETH.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loadingDelete}>
              {loadingDelete && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
