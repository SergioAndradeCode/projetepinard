'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Building2, Loader2, BadgeCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSmicRef } from '@/lib/oeth/calculs'
import { Button } from '@/components/ui/button'
import { FormESAT } from './FormESAT'
import { formatDate, formatEuros } from '@/lib/utils'
import type { ESATPurchase } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const SMIC_REF_COURANT = getSmicRef(new Date().getFullYear())

interface TableauESATProps {
  achats: ESATPurchase[]
  organizationId: string
  smicHoraire?: number
  onRefresh: () => void
  readonly?: boolean
}

export function TableauESAT({ achats, organizationId, smicHoraire = SMIC_REF_COURANT, onRefresh, readonly = false }: TableauESATProps) {
  const [editPurchase, setEditPurchase] = useState<ESATPurchase | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const totalMontant = achats.reduce((sum, a) => sum + a.montant_ht, 0)
  const totalUB = achats.reduce((sum, a) => sum + a.montant_ht / (400 * smicHoraire), 0)

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingDelete(true)
    const { error } = await supabase.from('esat_purchases').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Achat supprimé')
      onRefresh()
    }
    setDeleteId(null)
    setLoadingDelete(false)
  }

  if (achats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[#EBF2FA] rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-[#1E4A8C]" />
        </div>
        <p className="text-[16px] font-medium text-[#1A1A2E]">Aucun achat enregistré</p>
        <p className="text-sm text-[#6B7280] mt-1">Ajoutez vos achats auprès d&apos;ESAT et d&apos;EA</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Fournisseur</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Montant HT</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Date</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">UB générées</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1">Attestation <BadgeCheck className="w-3 h-3 text-green-600" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Notes</th>
              {!readonly && <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {achats.map((a) => {
              const ub = a.montant_ht / (400 * smicHoraire)
              return (
                <tr key={a.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">{a.fournisseur}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#1A1A2E] font-medium">{formatEuros(a.montant_ht)}</td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{formatDate(a.date_facture)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-[#1E4A8C]">{ub.toFixed(4)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {a.montant_attestation != null ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {formatEuros(a.montant_attestation)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B7280] italic">non saisie</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280] max-w-[160px] truncate">{a.notes ?? '—'}</td>
                  {!readonly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditPurchase(a)} className="h-8 w-8">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)} className="h-8 w-8 hover:text-[#B71C1C] hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#EBF2FA] border-t-2 border-[#1E4A8C]/20">
              <td className="px-4 py-3 text-sm font-semibold text-[#1A1A2E]">TOTAL</td>
              <td className="px-4 py-3 text-sm font-bold text-right text-[#1A1A2E]">{formatEuros(totalMontant)}</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-sm font-bold text-right text-[#1E4A8C]">{totalUB.toFixed(4)} UB</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {editPurchase && (
        <FormESAT
          open={true}
          onClose={() => setEditPurchase(null)}
          onSuccess={onRefresh}
          organizationId={organizationId}
          purchase={editPurchase}
          smicHoraire={smicHoraire}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cet achat ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">Cette action est irréversible.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
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
