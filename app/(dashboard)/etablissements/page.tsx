'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Building2, Star, Loader2, AlertTriangle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { calculerStats, getSmicRef } from '@/lib/oeth/calculs'
import type { Establishment } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  siret: z.string().min(14, 'SIRET requis (14 chiffres)').max(14, '14 chiffres exactement').regex(/^\d{14}$/, '14 chiffres uniquement'),
  address: z.string().nullable(),
  effectif_brut: z.number().int().min(0),
  effectif_ecap: z.number().int().min(0),
  is_headquarters: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function EtablissementsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Establishment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tauxParSite, setTauxParSite] = useState<Record<string, number>>({})
  const [dbError, setDbError] = useState(false)
  const currentYear = new Date().getFullYear()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { effectif_brut: 0, effectif_ecap: 0, is_headquarters: false },
  })
  const isHeadquarters = watch('is_headquarters')
  const effectifBrutWatch = watch('effectif_brut') ?? 0
  const effectifEcapWatch = watch('effectif_ecap') ?? 0
  const effectifAssujWatch = Math.max(0, effectifBrutWatch - effectifEcapWatch)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    const sitesRes = await supabase
      .from('establishments')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('is_headquarters', { ascending: false })
      .order('name')

    if (sitesRes.status === 404) {
      setDbError(true)
      setLoading(false)
      return
    }

    const sites = sitesRes.data
    setEtablissements(sites ?? [])

    // Calculer taux OETH par site
    if (sites?.length) {
      // Charger oeth_settings pour le SMIC (fallback sur getSmicRef)
      const [{ data: salaries }, { data: achats }, { data: oethSettings }] = await Promise.all([
        supabase.from('rqth_employees').select('*').eq('organization_id', profile.organization_id),
        supabase.from('esat_purchases').select('*').eq('organization_id', profile.organization_id),
        supabase.from('oeth_settings').select('smic_horaire_ref').eq('organization_id', profile.organization_id).eq('annee', currentYear).maybeSingle(),
      ])
      const smicRef = oethSettings?.smic_horaire_ref ?? getSmicRef(currentYear)
      const taux: Record<string, number> = {}
      for (const site of sites) {
        const s = (salaries ?? []).filter(e => e.establishment_id === site.id)
        const a = (achats ?? []).filter(e => e.establishment_id === site.id)
        const brut = site.effectif_brut || site.effectif_assujettissement
        const ecap = site.effectif_ecap || 0
        const stats = calculerStats(s, a, brut, ecap, smicRef)
        taux[site.id] = stats.taux
      }
      setTauxParSite(taux)
    }
    setLoading(false)
  }, [supabase, currentYear])

  useEffect(() => { loadData() }, [loadData])

  const openAdd = () => {
    setEditItem(null)
    reset({ effectif_brut: 0, effectif_ecap: 0, is_headquarters: false, name: '', siret: '', address: null })
    setShowForm(true)
  }
  const openEdit = (e: Establishment) => {
    setEditItem(e)
    reset({
      name: e.name,
      siret: e.siret ?? '',
      address: e.address,
      effectif_brut: e.effectif_brut || e.effectif_assujettissement,
      effectif_ecap: e.effectif_ecap || 0,
      is_headquarters: e.is_headquarters,
    })
    setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!orgId) return
    setSaving(true)
    const effectif_assujettissement = Math.max(0, data.effectif_brut - data.effectif_ecap)
    const payload = {
      ...data,
      address: data.address || null,
      effectif_assujettissement,
      organization_id: orgId,
      annee: currentYear,
    }
    const { error } = editItem
      ? await supabase.from('establishments').update(payload).eq('id', editItem.id)
      : await supabase.from('establishments').insert(payload)
    if (error) { toast.error("Erreur : " + error.message) }
    else { toast.success(editItem ? 'Établissement modifié' : 'Établissement créé'); setShowForm(false); loadData() }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('establishments').delete().eq('id', deleteId)
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Établissement supprimé'); loadData() }
    setDeleteId(null)
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>

  if (dbError) return (
    <div className="max-w-2xl">
      <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold text-amber-900">Migration requise</p>
          <p className="text-sm text-amber-800">
            La table <code className="bg-amber-100 px-1 rounded">establishments</code> n&apos;existe pas encore.
            Exécutez le fichier <code className="bg-amber-100 px-1 rounded">supabase/migrations_v2.sql</code> dans
            l&apos;éditeur SQL de votre projet Supabase pour activer les fonctionnalités multi-établissements.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Ajouter un établissement</Button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Établissement</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">SIRET</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Effectif assuj.</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Taux OETH</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {etablissements.map((e) => {
              const taux = tauxParSite[e.id] ?? 0
              const effectifAss = Math.max(0, (e.effectif_brut || e.effectif_assujettissement) - (e.effectif_ecap || 0))
              return (
                <tr key={e.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#6B7280] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E]">{e.name}</p>
                        {e.address && <p className="text-xs text-[#6B7280]">{e.address}</p>}
                      </div>
                      {e.is_headquarters && (
                        <span className="flex items-center gap-1 text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-2 py-0.5 rounded-full font-medium">
                          <Star className="w-3 h-3" />Siège
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{e.siret ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#1A1A2E] text-center font-medium">{effectifAss}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${taux >= 6 ? 'text-[#2E7D32]' : taux >= 3 ? 'text-[#BF5A00]' : 'text-[#B71C1C]'}`}>
                      {taux.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                      {!e.is_headquarters && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#B71C1C] hover:bg-red-50" onClick={() => setDeleteId(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {etablissements.length === 0 && (
          <div className="py-16 text-center text-[#6B7280]">Aucun établissement configuré</div>
        )}
      </div>

      {/* Modal form */}
      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Modifier l\'établissement' : 'Ajouter un établissement'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nom de l&apos;établissement <span className="text-[#B71C1C]">*</span></Label>
              <Input placeholder="ex : Site de Lyon" {...register('name')} />
              {errors.name && <p className="text-xs text-[#B71C1C]">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SIRET <span className="text-[#B71C1C]">*</span></Label>
                <Input placeholder="14 chiffres" maxLength={14} {...register('siret')} />
                {errors.siret && <p className="text-xs text-[#B71C1C]">{errors.siret.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Adresse <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
                <Input placeholder="ex : 12 rue de la Paix" {...register('address')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Effectif brut (ETP)</Label>
                <Input type="number" min={0} {...register('effectif_brut', { valueAsNumber: true })} />
                {errors.effectif_brut && <p className="text-xs text-[#B71C1C]">{errors.effectif_brut.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Postes ECAP</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <Info className="w-3.5 h-3.5 text-[#6B7280]" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Postes Exigeant des Conditions d&apos;Aptitude Particulières, exclus du calcul de l&apos;assujettissement (ex : pilotes, pompiers).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input type="number" min={0} {...register('effectif_ecap', { valueAsNumber: true })} />
              </div>
            </div>

            {/* Effectif d'assujettissement calculé (lecture seule) */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <p className="text-xs text-[#6B7280]">Effectif d&apos;assujettissement (calculé)</p>
              <p className="text-sm font-semibold text-[#1A1A2E]">{effectifAssujWatch} sal.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">Siège social</p>
                <p className="text-xs text-[#6B7280]">Un seul établissement peut être le siège</p>
              </div>
              <Switch checked={isHeadquarters} onCheckedChange={(v) => setValue('is_headquarters', v)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer l&apos;établissement ?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6B7280]">Les salariés RQTH et achats ESAT rattachés à ce site seront dissociés.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
