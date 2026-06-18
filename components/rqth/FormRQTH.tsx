'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { RQTHEmployee, Establishment } from '@/types'
import { LABEL_RECONNAISSANCE, LABEL_TYPE_CONTRAT } from '@/types'

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  matricule: z.string().nullable(),
  date_naissance: z.string().min(1, 'Date de naissance requise'),
  service: z.string().nullable(),
  poste: z.string().nullable(),
  batiment: z.string().nullable(),
  taux_temps_travail: z.number().int().min(1).max(100),
  establishment_id: z.string().nullable(),
  type_contrat: z.enum(['cdi', 'cdd', 'alternant', 'stagiaire', 'interimaire', 'autre']),
  type_reconnaissance: z.enum([
    'rqth', 'pension_invalidite_2', 'pension_invalidite_3',
    'aah', 'carte_mobilite_invalidite', 'rente_at_mp',
  ]),
  date_debut: z.string().min(1, 'Date de début requise'),
  est_permanent: z.boolean(),
  date_fin: z.string().nullable(),
  date_fin_contrat: z.string().nullable(),
  notes: z.string().nullable(),
})
type FormData = z.infer<typeof schema>

interface FormRQTHProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  employee?: RQTHEmployee
  defaultEstablishmentId?: string | null
}

export function FormRQTH({ open, onClose, onSuccess, organizationId, employee, defaultEstablishmentId }: FormRQTHProps) {
  const [loading, setLoading] = useState(false)
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const supabase = useMemo(() => createClient(), [])
  const isEdit = !!employee

  useEffect(() => {
    supabase
      .from('establishments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_headquarters', { ascending: false })
      .order('name')
      .then(({ data }) => setEtablissements(data ?? []))
  }, [supabase, organizationId])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      prenom: '',
      matricule: null,
      date_naissance: '',
      service: null,
      poste: null,
      batiment: null,
      taux_temps_travail: 100,
      establishment_id: defaultEstablishmentId ?? null,
      type_contrat: 'cdi',
      type_reconnaissance: 'rqth',
      date_debut: '',
      est_permanent: false,
      date_fin: null,
      date_fin_contrat: null,
      notes: null,
    },
  })

  useEffect(() => {
    if (employee) {
      reset({
        nom: employee.nom,
        prenom: employee.prenom,
        matricule: employee.matricule,
        date_naissance: employee.date_naissance ?? '',
        service: employee.service,
        poste: employee.poste,
        batiment: employee.batiment ?? null,
        taux_temps_travail: employee.taux_temps_travail ?? 100,
        establishment_id: employee.establishment_id ?? null,
        type_contrat: employee.type_contrat ?? 'cdi',
        type_reconnaissance: employee.type_reconnaissance,
        date_debut: employee.date_debut,
        est_permanent: employee.est_permanent,
        date_fin: employee.date_fin,
        date_fin_contrat: employee.date_fin_contrat ?? null,
        notes: employee.notes,
      })
    } else {
      reset({
        nom: '',
        prenom: '',
        matricule: null,
        date_naissance: '',
        service: null,
        poste: null,
        batiment: null,
        taux_temps_travail: 100,
        establishment_id: defaultEstablishmentId ?? null,
        type_contrat: 'cdi',
        type_reconnaissance: 'rqth',
        date_debut: '',
        est_permanent: false,
        date_fin: null,
        date_fin_contrat: null,
        notes: null,
      })
    }
  }, [employee, reset, open, defaultEstablishmentId])

  const estPermanent  = watch('est_permanent')
  const tauxTemps    = watch('taux_temps_travail')
  const dateNaissance = watch('date_naissance')
  const typeContrat  = watch('type_contrat')

  // Calcul live du coefficient senior et de l'aperçu UB
  const seniorInfo = useMemo(() => {
    if (!dateNaissance) return null
    const naissance = new Date(dateNaissance)
    if (isNaN(naissance.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - naissance.getFullYear()
    const anniversairePassé = today.getMonth() > naissance.getMonth() ||
      (today.getMonth() === naissance.getMonth() && today.getDate() >= naissance.getDate())
    if (!anniversairePassé) age--
    if (age < 0 || age > 120) return null
    const coeffAge = age >= 50 ? 1.5 : 1
    const ubPreview = (tauxTemps ?? 100) / 100 * coeffAge
    return { age, coeffAge, ubPreview }
  }, [dateNaissance, tauxTemps])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const typesSansFinContrat = new Set(['cdi'])
    const payload: Record<string, unknown> = {
      ...data,
      matricule: data.matricule || null,
      service: data.service || null,
      poste: data.poste || null,
      batiment: data.batiment || null,
      notes: data.notes || null,
      establishment_id: data.establishment_id || null,
      date_fin: data.est_permanent ? null : data.date_fin,
      date_fin_contrat: typesSansFinContrat.has(data.type_contrat) ? null : (data.date_fin_contrat || null),
      organization_id: organizationId,
    }

    const { error } = isEdit
      ? await supabase.from('rqth_employees').update(payload).eq('id', employee!.id)
      : await supabase.from('rqth_employees').insert(payload)

    if (error) {
      toast.error("Erreur lors de l'enregistrement")
    } else {
      toast.success(isEdit ? 'Reconnaissance modifiée' : 'Reconnaissance ajoutée')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier la reconnaissance' : 'Ajouter une reconnaissance RQTH'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Identité */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Identité du collaborateur</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom <span className="text-[#B71C1C]">*</span></Label>
                <Input placeholder="Jean" {...register('prenom')} />
                {errors.prenom && <p className="text-xs text-[#B71C1C]">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nom <span className="text-[#B71C1C]">*</span></Label>
                <Input placeholder="Dupont" {...register('nom')} />
                {errors.nom && <p className="text-xs text-[#B71C1C]">{errors.nom.message}</p>}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Matricule <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
              <Input placeholder="ex : EMP-001 ou 12345" {...register('matricule')} />
              <p className="text-xs text-[#6B7280]">Identifiant interne RH pour retrouver le collaborateur</p>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Date de naissance <span className="text-[#B71C1C]">*</span></Label>
              <div className="flex items-center gap-3">
                <Input type="date" className="w-44" {...register('date_naissance')} />
                {seniorInfo && (
                  seniorInfo.coeffAge === 1.5 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-md font-medium">
                      🎯 {seniorInfo.age} ans, ×1,5 UB senior
                      <span className="font-bold">→ {seniorInfo.ubPreview.toFixed(2)} UB</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">
                      {seniorInfo.age} ans, {seniorInfo.ubPreview.toFixed(2)} UB
                    </span>
                  )
                )}
              </div>
              {errors.date_naissance && <p className="text-xs text-[#B71C1C]">{errors.date_naissance.message}</p>}
              <p className="text-xs text-[#6B7280]">
                Requis pour le calcul OETH : les BOETH de <strong>50 ans et plus</strong> comptent pour <strong>1,5 unité bénéficiaire</strong> au lieu de 1.
              </p>
            </div>
          </div>

          {etablissements.length >= 1 && (
            <div className="space-y-1.5">
              <Label>Établissement <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
              <Select
                defaultValue={employee?.establishment_id ?? defaultEstablishmentId ?? '__none__'}
                onValueChange={(v) => setValue('establishment_id', v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non rattaché" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Non rattaché</SelectItem>
                  {etablissements.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}{e.is_headquarters ? ' (Siège)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="border-t border-[#E2E8F0] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Poste & organisation</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Service / Département <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                <Input placeholder="ex : RH, Comptabilité..." {...register('service')} />
              </div>
              <div className="space-y-1.5">
                <Label>Poste / Fonction <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                <Input placeholder="ex : Chargé de mission" {...register('poste')} />
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Bâtiment / Lieu de travail <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
              <Input placeholder="ex : Bâtiment A, Site Nord..." {...register('batiment')} />
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Taux de temps de travail</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  className="w-24"
                  {...register('taux_temps_travail', { valueAsNumber: true })}
                />
                <span className="text-sm text-[#6B7280]">%</span>
                {tauxTemps < 100 && (
                  <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-md">
                    → {(tauxTemps / 100).toFixed(2)} UB
                  </span>
                )}
                {tauxTemps === 100 && (
                  <span className="text-xs bg-[#EBF2FA] text-[#1E4A8C] border border-[#1E4A8C]/20 px-2 py-1 rounded-md">
                    → 1,00 UB
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">Un temps partiel réduit proportionnellement les unités bénéficiaires</p>
            </div>
          </div>

          {/* Type de contrat */}
          <div className="border-t border-[#E2E8F0] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Type de contrat</p>
            <div className="space-y-2">
              <Select
                defaultValue={employee?.type_contrat ?? 'cdi'}
                onValueChange={(v) => setValue('type_contrat', v as FormData['type_contrat'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_TYPE_CONTRAT).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {typeContrat === 'stagiaire' && (
                <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-lg px-3 py-2.5 text-xs text-[#1E4A8C] space-y-1">
                  <p><strong>Suivi interne uniquement - non comptabilisé OETH</strong></p>
                  <p>
                    Les stagiaires ne sont pas des salariés au sens du Code du travail (pas de contrat de travail).
                    Depuis la réforme de 2020, ils sont exclus du calcul des unités bénéficiaires et de l&apos;effectif d&apos;assujettissement OETH.
                  </p>
                  <p>
                    Vous pouvez les enregistrer ici pour piloter votre politique handicap en interne (suivi des reconnaissances, alertes de renouvellement),
                    mais ce collaborateur n&apos;apparaîtra pas dans vos calculs DOETH ni dans votre déclaration.
                  </p>
                </div>
              )}

              {typeContrat === 'alternant' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-xs text-green-800 space-y-1">
                  <p><strong>Comptabilise comme salarie BOETH dans votre DOETH</strong></p>
                  <p>
                    Les alternants (apprentissage ou professionnalisation) sont des salariés à part entière titulaires d&apos;un contrat de travail.
                    Ils sont inclus dans l&apos;effectif d&apos;assujettissement et comptent normalement dans vos unités bénéficiaires OETH, comme tout autre salarié.
                  </p>
                  <p>
                    Ce collaborateur sera automatiquement pris en compte dans vos calculs DOETH, proratisé selon ses mois de présence et son taux de temps de travail.
                  </p>
                </div>
              )}

              {typeContrat === 'interimaire' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
                  <strong>Important :</strong> Pour les intérimaires, l&apos;Obligation d&apos;Emploi des Travailleurs Handicapés (OETH)
                  incombe à l&apos;entreprise de travail temporaire (l&apos;agence), pas à votre entreprise.
                  Ce collaborateur peut être enregistré pour votre suivi interne, mais ne sera pas comptabilisé
                  dans vos unités bénéficiaires ni dans votre DOETH.
                </div>
              )}

              {typeContrat !== 'cdi' && (
                <div className="space-y-1.5 pt-1">
                  <Label>Date de fin de contrat <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                  <Input type="date" className="w-44" {...register('date_fin_contrat')} />
                  <p className="text-xs text-[#6B7280]">
                    {typeContrat === 'interimaire'
                      ? "Date de fin de mission. Ne remplace pas l'archivage lors du départ effectif."
                      : "Utile pour les alertes calendrier et les extractions. Ne remplace pas l'archivage lors du départ effectif."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reconnaissance */}
          <div className="border-t border-[#E2E8F0] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Reconnaissance</p>

            <div className="space-y-1.5">
              <Label>Type de reconnaissance <span className="text-[#B71C1C]">*</span></Label>
              <Select
                defaultValue={employee?.type_reconnaissance ?? 'rqth'}
                onValueChange={(v) => setValue('type_reconnaissance', v as FormData['type_reconnaissance'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_RECONNAISSANCE).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                <Label>Date de début <span className="text-[#B71C1C]">*</span></Label>
                <Input type="date" {...register('date_debut')} />
                {errors.date_debut && <p className="text-xs text-[#B71C1C]">{errors.date_debut.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  disabled={estPermanent}
                  {...register('date_fin')}
                  className={estPermanent ? 'opacity-50' : ''}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg mt-3">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">Reconnaissance permanente</p>
                <p className="text-xs text-[#6B7280]">Pas de date d&apos;expiration</p>
              </div>
              <Switch
                checked={estPermanent}
                onCheckedChange={(v) => setValue('est_permanent', v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
            <Textarea
              placeholder="Informations complémentaires, contexte..."
              {...register('notes')}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
