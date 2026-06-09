'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSmicRef } from '@/lib/oeth/calculs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ESATPurchase, Establishment } from '@/types'

const SMIC_REF_COURANT = getSmicRef(new Date().getFullYear())

const schema = z.object({
  fournisseur: z.string().min(1, 'Fournisseur requis'),
  montant_ht: z.number().positive({ message: 'Montant > 0' }),
  date_facture: z.string().min(1, 'Date requise'),
  establishment_id: z.string().min(1, 'Établissement requis'),
  notes: z.string().nullable(),
})
type FormData = z.infer<typeof schema>

interface FormESATProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  purchase?: ESATPurchase
  smicHoraire?: number
  defaultEstablishmentId?: string | null
}

export function FormESAT({
  open, onClose, onSuccess, organizationId, purchase,
  smicHoraire = SMIC_REF_COURANT, defaultEstablishmentId,
}: FormESATProps) {
  const [loading, setLoading] = useState(false)
  const [attestationInput, setAttestationInput] = useState('')
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const supabase = useMemo(() => createClient(), [])
  const isEdit = !!purchase

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fournisseur: '',
      montant_ht: undefined,
      date_facture: '',
      establishment_id: '',
      notes: null,
    },
  })

  // Charger les établissements
  useEffect(() => {
    if (!organizationId) return
    supabase
      .from('establishments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_headquarters', { ascending: false })
      .order('name')
      .then(({ data }) => setEtablissements((data ?? []) as Establishment[]))
  }, [organizationId, supabase])

  // Pré-remplir le formulaire à l'ouverture
  useEffect(() => {
    if (!open) return

    if (purchase) {
      reset({
        fournisseur: purchase.fournisseur,
        montant_ht: purchase.montant_ht,
        date_facture: purchase.date_facture,
        establishment_id: purchase.establishment_id ?? '',
        notes: purchase.notes,
      })
      setAttestationInput(purchase.montant_attestation != null ? String(purchase.montant_attestation) : '')
    } else {
      reset({ fournisseur: '', montant_ht: undefined, date_facture: '', establishment_id: '', notes: null })
      setAttestationInput('')
    }
  }, [purchase, open, reset])

  // Auto-sélection de l'établissement
  useEffect(() => {
    if (!open) return
    if (purchase) return // en édition, garder l'établissement existant

    if (defaultEstablishmentId) {
      setValue('establishment_id', defaultEstablishmentId)
    } else if (etablissements.length === 1) {
      setValue('establishment_id', etablissements[0].id)
    }
  }, [open, purchase, defaultEstablishmentId, etablissements, setValue])

  const montant = watch('montant_ht')
  const selectedEtabId = watch('establishment_id')
  const ubPreview = montant && montant > 0 ? montant / (400 * smicHoraire) : 0

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const attestationNum = attestationInput.trim() !== '' ? parseFloat(attestationInput) : null
    const payload: Record<string, unknown> = {
      ...data,
      organization_id: organizationId,
      ...(attestationNum != null && !isNaN(attestationNum) ? { montant_attestation: attestationNum } : {}),
    }

    const { error } = isEdit
      ? await supabase.from('esat_purchases').update(payload).eq('id', purchase!.id)
      : await supabase.from('esat_purchases').insert(payload)

    if (error) {
      toast.error("Erreur lors de l'enregistrement")
    } else {
      toast.success(isEdit ? 'Achat modifié' : 'Achat ajouté')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const selectedEtab = etablissements.find(e => e.id === selectedEtabId)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'achat" : 'Ajouter un achat ESAT/EA'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Champ caché pour que react-hook-form suive establishment_id même sans <input> visible */}
          <input type="hidden" {...register('establishment_id')} />

          {/* Établissement, obligatoire */}
          <div className="space-y-1.5">
            <Label>
              Établissement <span className="text-[#B71C1C]">*</span>
            </Label>
            {etablissements.length === 1 ? (
              // Un seul site : affiché en lecture seule, sélection automatique
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#EBF2FA] border border-[#1E4A8C]/20 text-sm text-[#1E4A8C]">
                {etablissements[0].name}
                {etablissements[0].is_headquarters && (
                  <span className="text-[10px] bg-[#1E4A8C]/10 px-1.5 py-0.5 rounded-full">Siège</span>
                )}
              </div>
            ) : (
              <Select
                value={selectedEtabId || undefined}
                onValueChange={v => setValue('establishment_id', v, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.establishment_id ? 'border-[#B71C1C]' : ''}>
                  <SelectValue placeholder="Sélectionner un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {etablissements.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}{e.is_headquarters ? ', Siège' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.establishment_id && (
              <p className="text-xs text-[#B71C1C]">{errors.establishment_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Nom du fournisseur ESAT/EA <span className="text-[#B71C1C]">*</span></Label>
            <Input placeholder="ex: ESAT Les Ateliers du Soleil" {...register('fournisseur')} />
            {errors.fournisseur && <p className="text-xs text-[#B71C1C]">{errors.fournisseur.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Montant HT (€) <span className="text-[#B71C1C]">*</span></Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('montant_ht', { valueAsNumber: true })}
              />
              {errors.montant_ht && <p className="text-xs text-[#B71C1C]">{errors.montant_ht.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date de facture <span className="text-[#B71C1C]">*</span></Label>
              <Input type="date" {...register('date_facture')} />
              {errors.date_facture && <p className="text-xs text-[#B71C1C]">{errors.date_facture.message}</p>}
            </div>
          </div>

          {/* Aperçu UB */}
          {ubPreview > 0 && (
            <div className="flex items-center justify-between p-3 bg-[#EBF2FA] rounded-lg border border-[#1E4A8C]/20">
              <div>
                <p className="text-sm text-[#1E4A8C]">Unités bénéficiaires générées</p>
                {selectedEtab && (
                  <p className="text-xs text-[#1E4A8C]/70 mt-0.5">Imputées sur : {selectedEtab.name}</p>
                )}
              </div>
              <p className="text-lg font-bold text-[#1E4A8C]">{ubPreview.toFixed(4)} UB</p>
            </div>
          )}

          {/* Montant attestation */}
          <div className="space-y-2 p-3 bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-lg">
            <div>
              <Label className="text-[#1E4A8C]">Montant de l&apos;attestation ESAT/EA (€), optionnel</Label>
              <p className="text-xs text-[#1E4A8C]/80 mt-0.5">
                Montant exact figurant sur l&apos;<strong>attestation annuelle</strong> remise par votre fournisseur
                (formule légale : 30% × (prix HT − coûts matières)).
                Si vous ne l&apos;avez pas encore reçue, laissez vide : Talenth utilisera une
                <strong> estimation à 30% du HT</strong> dans l&apos;assistant DOETH.
              </p>
            </div>
            <Input
              type="number"
              step="0.01"
              min={0}
              placeholder={montant && montant > 0 ? `Estimation : ${(montant * 0.3).toFixed(2)} €` : 'ex : 1 420.00'}
              value={attestationInput}
              onChange={e => setAttestationInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optionnel)</Label>
            <Textarea placeholder="Numéro de bon de commande, prestation..." {...register('notes')} rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
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
