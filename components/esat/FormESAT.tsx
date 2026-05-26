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
import type { ESATPurchase } from '@/types'

// SMIC de référence courant (utilisé comme valeur par défaut si non fourni par le parent)
const SMIC_REF_COURANT = getSmicRef(new Date().getFullYear())

// montant_attestation intentionnellement absent : géré hors Zod (setValueAs incompatible zodResolver)
const schema = z.object({
  fournisseur: z.string().min(1, 'Fournisseur requis'),
  montant_ht: z.number().positive({ message: 'Montant > 0' }),
  date_facture: z.string().min(1, 'Date requise'),
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

export function FormESAT({ open, onClose, onSuccess, organizationId, purchase, smicHoraire = SMIC_REF_COURANT, defaultEstablishmentId }: FormESATProps) {
  const [loading, setLoading] = useState(false)
  // Champ attestation géré séparément (string pour éviter tout conflit zodResolver)
  const [attestationInput, setAttestationInput] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const isEdit = !!purchase

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fournisseur: '',
      montant_ht: undefined,
      date_facture: '',
      notes: null,
    },
  })

  useEffect(() => {
    if (purchase) {
      reset({
        fournisseur: purchase.fournisseur,
        montant_ht: purchase.montant_ht,
        date_facture: purchase.date_facture,
        notes: purchase.notes,
      })
      setAttestationInput(purchase.montant_attestation != null ? String(purchase.montant_attestation) : '')
    } else {
      reset({ fournisseur: '', montant_ht: undefined, date_facture: '', notes: null })
      setAttestationInput('')
    }
  }, [purchase, open, reset])

  const montant = watch('montant_ht')
  const ubPreview = montant && montant > 0 ? montant / (400 * smicHoraire) : 0

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    // montant_attestation : inclus dans le payload uniquement si renseigné et migration appliquée
    const attestationNum = attestationInput.trim() !== '' ? parseFloat(attestationInput) : null
    // ub_generees est une colonne GENEREE par PostgreSQL — ne pas l'inclure dans le payload
    const payload: Record<string, unknown> = {
      ...data,
      organization_id: organizationId,
      establishment_id: purchase?.establishment_id ?? defaultEstablishmentId ?? null,
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'achat" : 'Ajouter un achat ESAT/EA'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nom du fournisseur ESAT/EA</Label>
            <Input placeholder="ex: ESAT Les Ateliers du Soleil" {...register('fournisseur')} />
            {errors.fournisseur && <p className="text-xs text-[#B71C1C]">{errors.fournisseur.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Montant HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('montant_ht', { valueAsNumber: true })}
              />
              {errors.montant_ht && <p className="text-xs text-[#B71C1C]">{errors.montant_ht.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date de facture</Label>
              <Input type="date" {...register('date_facture')} />
              {errors.date_facture && <p className="text-xs text-[#B71C1C]">{errors.date_facture.message}</p>}
            </div>
          </div>

          {/* Aperçu UB */}
          {ubPreview > 0 && (
            <div className="flex items-center justify-between p-3 bg-[#EBF2FA] rounded-lg border border-[#1E4A8C]/20">
              <p className="text-sm text-[#1E4A8C]">Unités bénéficiaires générées</p>
              <p className="text-lg font-bold text-[#1E4A8C]">{ubPreview.toFixed(4)} UB</p>
            </div>
          )}

          {/* Montant attestation — optionnel, géré hors Zod */}
          <div className="space-y-2 p-3 bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-lg">
            <div>
              <Label className="text-[#1E4A8C]">Montant de l&apos;attestation ESAT/EA (€) — optionnel</Label>
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
