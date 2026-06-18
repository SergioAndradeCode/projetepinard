'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Search, ChevronLeft, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  LABEL_TYPE_SITUATION,
  LABEL_STATUT_MAINTIEN,
  LABEL_RECONNAISSANCE,
  AMENAGEMENTS_OPTIONS,
  type MaintienEmploi,
  type RQTHEmployee,
} from '@/types'

const schema = z.object({
  prenom:                z.string().min(1),
  nom:                   z.string().min(1),
  poste:                 z.string().optional(),
  code_interne:          z.string().optional(),
  type_situation:        z.enum(['at_mp', 'maladie_longue', 'inaptitude_partielle', 'inaptitude_totale', 'autre']),
  date_debut_situation:  z.string().min(1, 'Date de début requise'),
  date_retour_prevue:    z.string().optional(),
  statut:                z.enum(['en_cours', 'amenage', 'reclasse', 'resolu', 'rupture']),
  detail_amenagements:   z.string().optional(),
  medecin_travail_saisi: z.boolean(),
  sameth_saisi:          z.boolean(),
  cap_emploi_saisi:      z.boolean(),
  notes:                 z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface FormMaintienProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  situation?: MaintienEmploi | null
  preselectedEmployee?: RQTHEmployee | null   // passé depuis le tableau RQTH
  rqthEmployeeId?: string | null              // lien FK maintien_emploi.rqth_employee_id
  /** Restreint la liste de salariés à un seul établissement (charge_mission / lecteur) */
  establishmentId?: string | null
}

export function FormMaintien({
  open, onClose, onSuccess, organizationId, situation, preselectedEmployee, rqthEmployeeId, establishmentId,
}: FormMaintienProps) {
  const supabase = useMemo(() => createClient(), [])
  const isEdit = !!situation

  // ── Étapes : 1 = choix salarié  |  2 = formulaire situation ─────────────
  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1)

  // ── Salarié sélectionné ───────────────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState<RQTHEmployee | null>(
    preselectedEmployee ?? null
  )

  // ── Liste RQTH ────────────────────────────────────────────────────────────
  const [rqthEmployees, setRqthEmployees] = useState<RQTHEmployee[]>([])
  const [rqthSearch, setRqthSearch]       = useState('')
  const [loadingList, setLoadingList]     = useState(false)

  // ── Formulaire react-hook-form (déclaré AVANT les useEffect qui utilisent setValue) ──
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        statut:                'en_cours',
        type_situation:        'at_mp',
        medecin_travail_saisi: false,
        sameth_saisi:          false,
        cap_emploi_saisi:      false,
      },
    })

  const [amenagementsList, setAmenagementsList] = useState<string[]>([])

  useEffect(() => {
    if (!open || isEdit) return
    setLoadingList(true)
    let q = supabase
      .from('rqth_employees')
      .select('id, prenom, nom, poste, matricule, service, type_reconnaissance, taux_temps_travail, date_naissance, date_debut, date_fin, est_permanent, batiment, notes, establishment_id, organization_id, created_at')
      .eq('organization_id', organizationId)
      .order('nom')
    if (establishmentId) q = q.eq('establishment_id', establishmentId)
    q.then(({ data }) => {
      setRqthEmployees((data as RQTHEmployee[]) ?? [])
      setLoadingList(false)
    })
  }, [open, isEdit, supabase, organizationId, establishmentId])

  // Réinitialisation à la fermeture
  useEffect(() => {
    if (!open) {
      setRqthSearch('')
    }
  }, [open])

  // ── Filtrage temps réel ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = rqthSearch.trim().toLowerCase()
    if (!q) return rqthEmployees
    return rqthEmployees.filter(e =>
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      (e.matricule?.toLowerCase().includes(q) ?? false) ||
      (e.poste?.toLowerCase().includes(q) ?? false) ||
      (e.service?.toLowerCase().includes(q) ?? false)
    )
  }, [rqthEmployees, rqthSearch])

  // Initialisation du formulaire à l'ouverture — inclut toujours prenom/nom
  // (évite que reset() n'écrase les setValue appelés pour preselectedEmployee)
  useEffect(() => {
    if (!open) return
    if (situation) {
      reset({
        prenom:                situation.prenom,
        nom:                   situation.nom,
        poste:                 situation.poste ?? '',
        code_interne:          situation.code_interne ?? '',
        type_situation:        situation.type_situation,
        date_debut_situation:  situation.date_debut_situation,
        date_retour_prevue:    situation.date_retour_prevue ?? '',
        statut:                situation.statut,
        detail_amenagements:   situation.detail_amenagements ?? '',
        medecin_travail_saisi: situation.medecin_travail_saisi,
        sameth_saisi:          situation.sameth_saisi,
        cap_emploi_saisi:      situation.cap_emploi_saisi,
        notes:                 situation.notes ?? '',
      })
      setAmenagementsList(situation.amenagements ?? [])
    } else {
      reset({
        prenom:                preselectedEmployee?.prenom ?? '',
        nom:                   preselectedEmployee?.nom ?? '',
        poste:                 preselectedEmployee?.poste ?? '',
        code_interne:          preselectedEmployee?.matricule ?? '',
        statut:                'en_cours',
        type_situation:        'at_mp',
        medecin_travail_saisi: false,
        sameth_saisi:          false,
        cap_emploi_saisi:      false,
      })
      setAmenagementsList([])
      setSelectedEmployee(preselectedEmployee ?? null)
      setStep(preselectedEmployee ? 2 : 1)
    }
  }, [open, situation, reset, preselectedEmployee])

  // Quand un employé est sélectionné → injecter ses données dans le formulaire
  const confirmSelection = (emp: RQTHEmployee) => {
    setSelectedEmployee(emp)
    setValue('prenom', emp.prenom)
    setValue('nom', emp.nom)
    setValue('poste', emp.poste ?? '')
    setValue('code_interne', emp.matricule ?? '')   // matricule → code interne maintien
    setStep(2)
  }

  // ── Soumission ────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const payload = {
      organization_id:       organizationId,
      rqth_employee_id:      rqthEmployeeId ?? selectedEmployee?.id ?? null,
      prenom:                data.prenom,
      nom:                   data.nom,
      poste:                 data.poste || null,
      code_interne:          data.code_interne || null,
      type_situation:        data.type_situation,
      date_debut_situation:  data.date_debut_situation,
      date_retour_prevue:    data.date_retour_prevue || null,
      statut:                data.statut,
      amenagements:          amenagementsList.length > 0 ? amenagementsList : null,
      detail_amenagements:   data.detail_amenagements || null,
      medecin_travail_saisi: data.medecin_travail_saisi,
      sameth_saisi:          data.sameth_saisi,
      cap_emploi_saisi:      data.cap_emploi_saisi,
      notes:                 data.notes || null,
    }
    try {
      if (isEdit && situation) {
        const { error } = await supabase.from('maintien_emploi').update(payload).eq('id', situation.id)
        if (error) throw error
        toast.success('Situation mise à jour')
      } else {
        const { error } = await supabase.from('maintien_emploi').insert(payload)
        if (error) throw error
        toast.success('Situation enregistrée')
      }
      onSuccess()
      onClose()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const toggleAmenagement = (val: string) => {
    setAmenagementsList(prev =>
      prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]
    )
  }

  const medecin   = watch('medecin_travail_saisi')
  const sameth    = watch('sameth_saisi')
  const capEmploi = watch('cap_emploi_saisi')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* ══════════════════════════════════════════════════════════════════
            ÉTAPE 1, Sélection du salarié RQTH
        ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Nouvelle situation, Sélectionner le salarié</DialogTitle>
              <p className="text-sm text-[#6B7280] mt-1">
                Choisissez le salarié RQTH concerné par cette action de maintien dans l&apos;emploi.
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, poste ou code interne…"
                  value={rqthSearch}
                  onChange={e => setRqthSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/20 focus:border-[#1E4A8C] placeholder:text-[#9CA3AF]"
                  autoFocus
                />
              </div>

              {/* Liste des salariés */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                {loadingList ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-[#6B7280]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Chargement…</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[#9CA3AF]">
                      {rqthSearch ? `Aucun résultat pour « ${rqthSearch} »` : 'Aucun salarié RQTH enregistré'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-[#F1F5F9]">
                    {filtered.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => confirmSelection(emp)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[#EBF2FA] transition-colors text-left group"
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[#EBF2FA] group-hover:bg-[#1E4A8C]/10 flex items-center justify-center shrink-0 transition-colors">
                          <span className="text-[12px] font-bold text-[#1E4A8C]">
                            {emp.prenom[0]}{emp.nom[0]}
                          </span>
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#1E4A8C]">
                            {emp.prenom} {emp.nom}
                            {emp.matricule && (
                              <span className="ml-1.5 text-[10px] font-normal text-[#9CA3AF]">#{emp.matricule}</span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {LABEL_RECONNAISSANCE[emp.type_reconnaissance]}
                            {emp.poste ? ` · ${emp.poste}` : ''}
                            {emp.service ? ` · ${emp.service}` : ''}
                          </p>
                        </div>

                        {/* Flèche indicatrice */}
                        <span className="text-[#9CA3AF] group-hover:text-[#1E4A8C] text-lg leading-none transition-colors shrink-0">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#9CA3AF] text-center">
                {filtered.length} salarié{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                {rqthEmployees.length !== filtered.length && ` sur ${rqthEmployees.length}`}
              </p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ÉTAPE 2, Détails de la situation
        ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? 'Modifier la situation' : 'Nouvelle situation de maintien dans l\'emploi'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Salarié sélectionné (bannière récapitulative) ── */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#EBF2FA] border border-[#1E4A8C]/20">
                <div className="w-9 h-9 rounded-full bg-[#1E4A8C] flex items-center justify-center shrink-0">
                  {selectedEmployee ? (
                    <span className="text-[12px] font-bold text-white">
                      {selectedEmployee.prenom[0]}{selectedEmployee.nom[0]}
                    </span>
                  ) : (
                    <UserCheck className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E4A8C]">
                    {selectedEmployee
                      ? `${selectedEmployee.prenom} ${selectedEmployee.nom}`
                      : `${watch('prenom')} ${watch('nom')}`}
                  </p>
                  <p className="text-[11px] text-[#1E4A8C]/70 truncate">
                    {selectedEmployee
                      ? LABEL_RECONNAISSANCE[selectedEmployee.type_reconnaissance] +
                        (selectedEmployee.poste ? ` · ${selectedEmployee.poste}` : '')
                      : watch('poste') || 'Salarié RQTH'}
                  </p>
                </div>
                {/* Bouton retour étape 1 (création uniquement, pas si pré-sélectionné depuis tableau) */}
                {!isEdit && !preselectedEmployee && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs text-[#1E4A8C]/70 hover:text-[#1E4A8C] transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Changer
                  </button>
                )}
              </div>

              <Separator />

              {/* ── Section 1 : Nature de la situation ── */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Nature de la situation</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Type de situation <span className="text-[#B71C1C]">*</span></Label>
                    <Select
                      value={watch('type_situation')}
                      onValueChange={(v) => setValue('type_situation', v as FormData['type_situation'])}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LABEL_TYPE_SITUATION).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Statut de suivi <span className="text-[#B71C1C]">*</span></Label>
                    <Select
                      value={watch('statut')}
                      onValueChange={(v) => setValue('statut', v as FormData['statut'])}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LABEL_STATUT_MAINTIEN).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Date de début <span className="text-[#B71C1C]">*</span></Label>
                    <Input type="date" {...register('date_debut_situation')} />
                    {errors.date_debut_situation && (
                      <p className="text-xs text-[#B71C1C]">{errors.date_debut_situation.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date de retour prévue <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                    <Input type="date" {...register('date_retour_prevue')} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Section 2 : Aménagements ── */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Aménagements mis en place</p>
                <div className="grid grid-cols-2 gap-2">
                  {AMENAGEMENTS_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                        amenagementsList.includes(value)
                          ? 'bg-[#EBF2FA] border-[#1E4A8C]/40 text-[#1E4A8C] font-medium'
                          : 'bg-white border-[#E2E8F0] text-[#6B7280] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-[#1E4A8C]"
                        checked={amenagementsList.includes(value)}
                        onChange={() => toggleAmenagement(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>Détail des aménagements <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                  <textarea
                    {...register('detail_amenagements')}
                    rows={2}
                    placeholder="Précisez les aménagements mis en place..."
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/20 focus:border-[#1E4A8C] resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* ── Section 3 : Interlocuteurs ── */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Interlocuteurs sollicités</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'medecin_travail_saisi' as const, label: 'Médecin du travail informé / saisi',                                 checked: medecin },
                    { field: 'sameth_saisi'          as const, label: 'SAMETH (Service d\'Appui au Maintien dans l\'Emploi des TH) saisi',  checked: sameth },
                    { field: 'cap_emploi_saisi'      as const, label: 'Cap Emploi saisi',                                                    checked: capEmploi },
                  ].map(({ field, label, checked }) => (
                    <label
                      key={field}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                        checked ? 'bg-[#EBF2FA] border-[#1E4A8C]/30 text-[#1E4A8C]' : 'bg-white border-[#E2E8F0] text-[#6B7280]'
                      }`}
                    >
                      <input type="checkbox" className="accent-[#1E4A8C] w-4 h-4" {...register(field)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── Section 4 : Notes ── */}
              <div className="space-y-1.5">
                <Label>Notes libres <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Contexte, historique, points d'attention particuliers..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E4A8C]/20 focus:border-[#1E4A8C] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                  ) : (
                    isEdit ? 'Mettre à jour' : 'Enregistrer la situation'
                  )}
                </Button>
              </div>

            </form>
          </>
        )}

      </DialogContent>
    </Dialog>
  )
}
