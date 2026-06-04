'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Info, Building2, Calculator, Trash2, AlertTriangle, Lock, Star, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { getCoefficientContribution, getSmicRef, calculerStats } from '@/lib/oeth/calculs'
import { QUOTA_LEGAL } from '@/lib/oeth/calculs'
import type { Establishment } from '@/types'

const orgSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  siret: z.string().optional(),
})

const oethSchema = z.object({
  annee: z.number(),
  effectif_brut: z.number().int().min(1, 'Requis'),
  effectif_ecap: z.number().int().min(0),
  smic_horaire_ref: z.number().positive(),
})

export default function ParametresPage() {
  const [loading, setLoading] = useState(true)
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingOETH, setSavingOETH] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('')
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [tauxParSite, setTauxParSite] = useState<Record<string, number>>({})
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const anneeActuelle = new Date().getFullYear()

  const orgForm = useForm<z.infer<typeof orgSchema>>({ resolver: zodResolver(orgSchema) })
  const oethForm = useForm<z.infer<typeof oethSchema>>({
    resolver: zodResolver(oethSchema),
    defaultValues: {
      annee: anneeActuelle,
      effectif_brut: 0,
      effectif_ecap: 0,
      smic_horaire_ref: getSmicRef(anneeActuelle),
    },
  })

  const effectifBrut = oethForm.watch('effectif_brut') ?? 0
  const effectifEcap = oethForm.watch('effectif_ecap') ?? 0
  const effectifAssujettissement = Math.max(0, effectifBrut - effectifEcap)
  const quotaLegal = effectifAssujettissement * QUOTA_LEGAL
  const coefficient = getCoefficientContribution(effectifAssujettissement)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }

    setOrgId(profile.organization_id)
    setRole(profile.role ?? '')
    // Un profil rattaché à un établissement précis = profil local → lecture seule
    setIsReadOnly(!!profile.establishment_id)

    const [{ data: org }, { data: settings }, sitesRes, { data: salaries }, { data: achats }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
      supabase.from('oeth_settings').select('*').eq('organization_id', profile.organization_id).eq('annee', anneeActuelle).single(),
      supabase.from('establishments').select('*').eq('organization_id', profile.organization_id).order('is_headquarters', { ascending: false }).order('name'),
      supabase.from('rqth_employees').select('*').eq('organization_id', profile.organization_id),
      supabase.from('esat_purchases').select('*').eq('organization_id', profile.organization_id),
    ])

    if (org) orgForm.reset({ name: org.name, siret: org.siret ?? '' })

    let smicRef = getSmicRef(anneeActuelle)
    if (settings) {
      const brut = settings.effectif_brut || settings.effectif_assujettissement || 0
      const ecap = settings.effectif_ecap || 0
      smicRef = settings.smic_horaire_ref ?? smicRef
      oethForm.reset({
        annee: settings.annee,
        effectif_brut: brut,
        effectif_ecap: ecap,
        smic_horaire_ref: smicRef,
      })
    }

    const sites = sitesRes.data ?? []
    setEtablissements(sites)

    // Calcul du taux OETH par site
    if (sites.length > 0) {
      const taux: Record<string, number> = {}
      for (const site of sites) {
        const s = (salaries ?? []).filter(e => e.establishment_id === site.id)
        const a = (achats ?? []).filter(e => e.establishment_id === site.id)
        const brut = site.effectif_brut || site.effectif_assujettissement || 0
        const ecap = site.effectif_ecap || 0
        const stats = calculerStats(s, a, brut, ecap, smicRef)
        taux[site.id] = stats.taux
      }
      setTauxParSite(taux)
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, anneeActuelle])

  useEffect(() => { loadData() }, [loadData])

  const saveOrg = async (data: z.infer<typeof orgSchema>) => {
    if (!orgId) return
    setSavingOrg(true)
    const { error } = await supabase.from('organizations').update(data).eq('id', orgId)
    if (error) toast.error('Erreur lors de la sauvegarde')
    else toast.success('Organisation mise à jour')
    setSavingOrg(false)
  }

  const deleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) throw new Error()
      await supabase.auth.signOut()
      router.push('/login?deleted=1')
    } catch {
      toast.error('Erreur lors de la suppression. Contactez talenthsupport@gmail.com')
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  const saveOETH = async (data: z.infer<typeof oethSchema>) => {
    if (!orgId) return
    setSavingOETH(true)
    const effectif_assujettissement = Math.max(0, data.effectif_brut - data.effectif_ecap)
    const coefficient_contribution = getCoefficientContribution(effectif_assujettissement)
    const { error } = await supabase.from('oeth_settings').upsert({
      ...data,
      effectif_assujettissement,
      coefficient_contribution,
      organization_id: orgId,
    }, { onConflict: 'organization_id,annee' })
    if (error) toast.error('Erreur lors de la sauvegarde')
    else toast.success('Paramètres OETH mis à jour')
    setSavingOETH(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const coefficientLabel = effectifAssujettissement >= 750 ? '600 h (≥ 750 sal.)' : effectifAssujettissement >= 250 ? '500 h (250–749 sal.)' : '400 h (< 250 sal.)'
  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Bannière lecture seule */}
      {isReadOnly && (
        <div className="flex items-start gap-3 bg-[#EBF2FA] border border-[#BFDBFE] rounded-xl px-4 py-3.5">
          <Lock className="w-4 h-4 text-[#1E4A8C] mt-0.5 shrink-0" />
          <p className="text-sm text-[#1E4A8C]">
            Ces paramètres sont définis par le responsable national.
            Vous pouvez les consulter mais pas les modifier.
          </p>
        </div>
      )}

      {/* Organisation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1E4A8C]" />
            </div>
            <div>
              <CardTitle>Informations de l&apos;entreprise</CardTitle>
              <CardDescription>Données d&apos;identification de votre organisation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isReadOnly ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Nom de l&apos;entreprise</p>
                <p className="text-sm font-semibold text-[#1A1A2E]">{orgForm.getValues('name') || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">SIRET</p>
                <p className="text-sm text-[#1A1A2E]">{orgForm.getValues('siret') || '—'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={orgForm.handleSubmit(saveOrg)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom de l&apos;entreprise</Label>
                <Input placeholder="Mon Entreprise SAS" {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <p className="text-xs text-[#B71C1C]">{orgForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>SIRET (optionnel)</Label>
                <Input placeholder="12345678901234" {...orgForm.register('siret')} />
              </div>
              <Button type="submit" disabled={savingOrg}>
                {savingOrg && <Loader2 className="w-4 h-4 animate-spin" />}
                Sauvegarder
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Paramètres OETH */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#1E4A8C]" />
            </div>
            <div>
              <CardTitle>Paramètres OETH {anneeActuelle}</CardTitle>
              <CardDescription>Données utilisées pour le calcul de votre taux et de votre contribution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isReadOnly ? (
            <div className="space-y-6">
              {/* Effectifs en lecture seule */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Effectifs</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Effectif brut (ETP)</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{effectifBrut} sal.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Postes ECAP</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{effectifEcap}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="text-xs text-[#6B7280]">Effectif d&apos;assujettissement</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{effectifAssujettissement} sal.</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Quota légal (6%)</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{quotaLegal.toFixed(2)} UB</p>
                  </div>
                </div>
              </div>
              {/* Paramètres de calcul en lecture seule */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Paramètres de calcul</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">SMIC horaire de référence</p>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{oethForm.getValues('smic_horaire_ref')?.toFixed(2)} €</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-xs text-[#6B7280]">Coefficient de contribution</p>
                  <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">{coefficient} h — {coefficientLabel}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">400 h si &lt; 250 sal. · 500 h si 250–749 sal. · 600 h si ≥ 750 sal.</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={oethForm.handleSubmit(saveOETH)} className="space-y-6">

              {/* Section Effectifs */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Effectifs</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label>Effectif brut (ETP annuel moyen) <span className="text-[#B71C1C]">*</span></Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <Info className="w-4 h-4 text-[#6B7280]" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Nombre total de salariés exprimé en équivalent temps plein (ETP), calculé comme la moyenne annuelle des effectifs mensuels. Inclut CDI, CDD, intérimaires proratisés, mais exclut apprentis et stagiaires.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      placeholder="ex: 150"
                      {...oethForm.register('effectif_brut', { valueAsNumber: true })}
                    />
                    {oethForm.formState.errors.effectif_brut && (
                      <p className="text-xs text-[#B71C1C]">{oethForm.formState.errors.effectif_brut.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label>Postes ECAP</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <Info className="w-4 h-4 text-[#6B7280]" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Postes Exigeant des Conditions d&apos;Aptitude Particulières (ex : pilotes, pompiers, forces de sécurité). Ces postes sont exclus par décret du calcul de l&apos;effectif d&apos;assujettissement.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="ex: 0"
                      {...oethForm.register('effectif_ecap', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Valeurs calculées en lecture seule */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="text-xs text-[#6B7280]">Effectif d&apos;assujettissement</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{effectifAssujettissement} sal.</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Quota légal (6%)</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{quotaLegal.toFixed(2)} UB</p>
                  </div>
                </div>
              </div>

              {/* Section Paramètres de calcul */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Paramètres de calcul</p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>SMIC horaire de référence (€)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <Info className="w-4 h-4 text-[#6B7280]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>SMIC horaire brut au 31 décembre de l&apos;année de référence, tel que défini par l&apos;AGEFIPH.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    {...oethForm.register('smic_horaire_ref', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-[#6B7280]">Valeur officielle pré-remplie pour {anneeActuelle}</p>
                </div>

                {/* Coefficient en lecture seule */}
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-xs text-[#6B7280]">Coefficient de contribution (auto-calculé)</p>
                  <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">{coefficient} h — {coefficientLabel}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">400 h si &lt; 250 sal. · 500 h si 250–749 sal. · 600 h si ≥ 750 sal.</p>
                </div>
              </div>

              <Button type="submit" disabled={savingOETH}>
                {savingOETH && <Loader2 className="w-4 h-4 animate-spin" />}
                Recalculer et sauvegarder
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Établissements — visible par tous */}
      {etablissements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#1E4A8C]" />
              </div>
              <div>
                <CardTitle>Sites et établissements</CardTitle>
                <CardDescription>
                  {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''} configuré{etablissements.length > 1 ? 's' : ''}
                  {isAdmin && <span className="text-[#1E4A8C] font-medium"> · Modifiables depuis la page Établissements</span>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F1F5F9]">
              {etablissements.map((e) => {
                const effectifAss = Math.max(0, (e.effectif_brut || e.effectif_assujettissement || 0) - (e.effectif_ecap || 0))
                const taux = tauxParSite[e.id] ?? 0
                return (
                  <div key={e.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 bg-[#EBF2FA] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4 text-[#1E4A8C]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#1A1A2E]">{e.name}</p>
                            {e.is_headquarters && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-2 py-0.5 rounded-full font-medium">
                                <Star className="w-3 h-3" />Siège
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {e.siret && (
                              <span className="text-xs text-[#6B7280]">SIRET : {e.siret}</span>
                            )}
                            {e.address && (
                              <span className="text-xs text-[#6B7280] truncate">{e.address}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-[#6B7280]">Effectif assuj.</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">{effectifAss} sal.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#6B7280]">Taux OETH</p>
                          <p className={`text-sm font-semibold ${taux >= 6 ? 'text-[#2E7D32]' : taux >= 3 ? 'text-[#BF5A00]' : 'text-[#B71C1C]'}`}>
                            {taux.toFixed(1)} %
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de danger — suppression de compte */}
      <div className="border border-red-200 rounded-2xl p-6 bg-red-50/40">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#B71C1C]" />
          </div>
          <div>
            <p className="font-semibold text-[#1A1A2E]">Supprimer mon compte</p>
            {isAdmin ? (
              <p className="text-sm text-[#6B7280] mt-0.5">
                Cette action est <strong>irréversible</strong>. En tant qu&apos;administrateur, votre compte
                et l&apos;accès à l&apos;organisation seront désactivés. Les données (salariés BOETH, budget, paramètres)
                sont conservées 30 jours puis supprimées définitivement. Exportez vos données avant de continuer.
              </p>
            ) : (
              <p className="text-sm text-[#6B7280] mt-0.5">
                Cette action supprime <strong>uniquement votre accès</strong> à Talenth.
                Les données de l&apos;organisation (salariés BOETH, budget, paramètres) ne sont pas affectées
                et restent accessibles aux autres membres de l&apos;équipe.
              </p>
            )}
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="secondary"
            className="border-red-200 text-[#B71C1C] hover:bg-red-100"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </Button>
        ) : (
          <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[#B71C1C]">
              {isAdmin
                ? 'Êtes-vous certain de vouloir désactiver l\'organisation et supprimer votre compte ?'
                : 'Êtes-vous certain de vouloir supprimer votre accès à Talenth ?'}
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={deletingAccount}
                onClick={deleteAccount}
                className="bg-[#B71C1C] hover:bg-red-800 text-white"
              >
                {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                Oui, supprimer mon compte
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={deletingAccount}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
