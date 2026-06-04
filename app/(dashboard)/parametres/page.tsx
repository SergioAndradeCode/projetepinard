'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Info, Building2, Calculator, Trash2, AlertTriangle, Lock, Star, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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

// Schéma organisation
const orgSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  siret: z.string().optional(),
})

// Schéma SMIC uniquement (l'effectif vient des établissements)
const smicSchema = z.object({
  annee: z.number(),
  smic_horaire_ref: z.number().positive('Valeur requise'),
})

// Schéma legacy : quand aucun établissement n'a d'effectif, on permet la saisie directe
const oethLegacySchema = z.object({
  annee: z.number(),
  effectif_brut: z.number().int().min(1, 'Requis'),
  effectif_ecap: z.number().int().min(0),
  smic_horaire_ref: z.number().positive('Valeur requise'),
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

  // Formulaire SMIC seul (quand établissements configurés)
  const smicForm = useForm<z.infer<typeof smicSchema>>({
    resolver: zodResolver(smicSchema),
    defaultValues: { annee: anneeActuelle, smic_horaire_ref: getSmicRef(anneeActuelle) },
  })

  // Formulaire legacy (quand aucun établissement n'a d'effectif)
  const legacyForm = useForm<z.infer<typeof oethLegacySchema>>({
    resolver: zodResolver(oethLegacySchema),
    defaultValues: {
      annee: anneeActuelle,
      effectif_brut: 0,
      effectif_ecap: 0,
      smic_horaire_ref: getSmicRef(anneeActuelle),
    },
  })

  const legacyEffectifBrut = legacyForm.watch('effectif_brut') ?? 0
  const legacyEffectifEcap = legacyForm.watch('effectif_ecap') ?? 0

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }

    setOrgId(profile.organization_id)
    setRole(profile.role ?? '')
    setIsReadOnly(!!profile.establishment_id)

    const [{ data: org }, { data: settings }, sitesRes, { data: salaries }, { data: achats }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
      supabase.from('oeth_settings').select('*').eq('organization_id', profile.organization_id).eq('annee', anneeActuelle).single(),
      supabase.from('establishments').select('*').eq('organization_id', profile.organization_id)
        .order('is_headquarters', { ascending: false }).order('name'),
      supabase.from('rqth_employees').select('*').eq('organization_id', profile.organization_id),
      supabase.from('esat_purchases').select('*').eq('organization_id', profile.organization_id),
    ])

    if (org) orgForm.reset({ name: org.name, siret: org.siret ?? '' })

    const smicRef = settings?.smic_horaire_ref ?? getSmicRef(anneeActuelle)
    smicForm.reset({ annee: anneeActuelle, smic_horaire_ref: smicRef })

    // Legacy : renseigner aussi le formulaire complet si l'utilisateur n'a pas d'établissements
    const fallbackBrut = settings?.effectif_brut || settings?.effectif_assujettissement || 0
    const fallbackEcap = settings?.effectif_ecap || 0
    legacyForm.reset({
      annee: anneeActuelle,
      effectif_brut: fallbackBrut,
      effectif_ecap: fallbackEcap,
      smic_horaire_ref: smicRef,
    })

    const sites = sitesRes.data ?? []
    setEtablissements(sites)

    // Calcul taux OETH par site
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

  // Sauvegarde du SMIC seul (quand établissements configurés)
  const saveSmic = async (data: z.infer<typeof smicSchema>) => {
    if (!orgId) return
    setSavingOETH(true)
    const { error } = await supabase.from('oeth_settings').upsert(
      { ...data, organization_id: orgId },
      { onConflict: 'organization_id,annee' }
    )
    if (error) toast.error('Erreur lors de la sauvegarde')
    else toast.success('SMIC de référence mis à jour')
    setSavingOETH(false)
  }

  // Sauvegarde legacy : effectif + SMIC (quand pas d'établissements configurés)
  const saveLegacy = async (data: z.infer<typeof oethLegacySchema>) => {
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  // Un établissement "configuré" = au moins un site avec effectif_brut renseigné
  const etablissementsAvecEffectif = etablissements.filter(e => (e.effectif_brut || 0) > 0)
  const hasEtablissementsEffectif = etablissementsAvecEffectif.length > 0

  // Totaux calculés depuis les établissements
  const totalBrut = etablissements.reduce((s, e) => s + (e.effectif_brut || 0), 0)
  const totalEcap = etablissements.reduce((s, e) => s + (e.effectif_ecap || 0), 0)
  const totalAssuj = Math.max(0, totalBrut - totalEcap)
  const quotaLegal = totalAssuj * QUOTA_LEGAL
  const smicRef = smicForm.watch('smic_horaire_ref') ?? getSmicRef(anneeActuelle)
  const coefficient = getCoefficientContribution(hasEtablissementsEffectif ? totalAssuj : Math.max(0, legacyEffectifBrut - legacyEffectifEcap))
  const effectifAssujLegacy = Math.max(0, legacyEffectifBrut - legacyEffectifEcap)

  const isAdmin = role === 'admin'
  const coefficientLabel = (eff: number) =>
    eff >= 750 ? '600 h (≥ 750 sal.)' : eff >= 250 ? '500 h (250–749 sal.)' : '400 h (< 250 sal.)'

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

      {/* ── Organisation ──────────────────────────────────────────────────────── */}
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
                <Label>SIRET <span className="text-[#9CA3AF] font-normal">(optionnel)</span></Label>
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

      {/* ── Paramètres OETH ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#1E4A8C]" />
            </div>
            <div>
              <CardTitle>Paramètres OETH {anneeActuelle}</CardTitle>
              <CardDescription>
                {hasEtablissementsEffectif
                  ? 'Effectifs consolidés depuis vos établissements · SMIC modifiable ici'
                  : 'Données utilisées pour le calcul de votre taux et de votre contribution'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isReadOnly ? (
            /* ── Lecture seule (profil local) ── */
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Effectifs</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Effectif brut total</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{totalBrut} sal.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Postes ECAP</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{totalEcap}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="text-xs text-[#6B7280]">Effectif d&apos;assujettissement</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{totalAssuj} sal.</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Quota légal (6%)</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{quotaLegal.toFixed(2)} UB</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">Paramètres de calcul</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">SMIC horaire de référence</p>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{smicRef.toFixed(2)} €</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-xs text-[#6B7280]">Coefficient de contribution</p>
                  <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">{coefficient} h — {coefficientLabel(totalAssuj)}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">400 h si &lt; 250 sal. · 500 h si 250–749 sal. · 600 h si ≥ 750 sal.</p>
                </div>
              </div>
            </div>
          ) : hasEtablissementsEffectif ? (
            /* ── Mode normal : effectifs depuis les établissements, SMIC éditable ── */
            <div className="space-y-6">
              {/* Effectifs consolidés (lecture seule car gérés dans Établissements) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2 flex-1">Effectifs consolidés</p>
                  <Link href="/etablissements" className="text-xs text-[#1E4A8C] hover:underline flex items-center gap-1 mb-2 ml-3">
                    Modifier dans Établissements <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-3 bg-[#EBF2FA] border border-[#BFDBFE] rounded-lg">
                  <p className="text-xs text-[#1E4A8C] font-medium mb-2">
                    Calculé automatiquement depuis la somme de vos {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-[#6B7280]">Effectif brut</p>
                      <p className="text-base font-bold text-[#1A1A2E]">{totalBrut}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">ECAP</p>
                      <p className="text-base font-bold text-[#1A1A2E]">{totalEcap}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Assujettissement</p>
                      <p className="text-base font-bold text-[#1E4A8C]">{totalAssuj}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#BFDBFE]">
                    <div>
                      <p className="text-xs text-[#6B7280]">Quota légal (6%)</p>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{quotaLegal.toFixed(2)} UB</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Coefficient</p>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{coefficient} h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMIC éditable */}
              <form onSubmit={smicForm.handleSubmit(saveSmic)} className="space-y-4">
                <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">SMIC de référence</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>SMIC horaire de référence (€)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <Info className="w-4 h-4 text-[#6B7280]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>SMIC horaire brut au 31 décembre de l&apos;année, tel que défini par l&apos;AGEFIPH pour le calcul de la contribution.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" step="0.01" {...smicForm.register('smic_horaire_ref', { valueAsNumber: true })} />
                  <p className="text-xs text-[#6B7280]">Valeur officielle pré-remplie pour {anneeActuelle}</p>
                  {smicForm.formState.errors.smic_horaire_ref && (
                    <p className="text-xs text-[#B71C1C]">{smicForm.formState.errors.smic_horaire_ref.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={savingOETH}>
                  {savingOETH && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sauvegarder le SMIC
                </Button>
              </form>
            </div>
          ) : (
            /* ── Mode legacy : aucun établissement avec effectif, saisie directe ── */
            <div className="space-y-4">
              {etablissements.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Vous avez {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''} configuré{etablissements.length > 1 ? 's' : ''} mais sans effectif renseigné.
                    Renseignez l&apos;effectif par établissement dans{' '}
                    <Link href="/etablissements" className="underline font-medium">la page Établissements</Link>
                    {' '}pour une meilleure précision, ou saisissez le total ci-dessous.
                  </p>
                </div>
              )}
              <form onSubmit={legacyForm.handleSubmit(saveLegacy)} className="space-y-6">
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
                              <p>Nombre total de salariés en équivalent temps plein, moyenne annuelle. Inclut CDI, CDD, intérimaires, exclut apprentis et stagiaires.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input type="number" min={1} placeholder="ex: 150" {...legacyForm.register('effectif_brut', { valueAsNumber: true })} />
                      {legacyForm.formState.errors.effectif_brut && (
                        <p className="text-xs text-[#B71C1C]">{legacyForm.formState.errors.effectif_brut.message}</p>
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
                              <p>Postes Exigeant des Conditions d&apos;Aptitude Particulières, exclus du calcul de l&apos;assujettissement.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input type="number" min={0} placeholder="ex: 0" {...legacyForm.register('effectif_ecap', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div>
                      <p className="text-xs text-[#6B7280]">Effectif d&apos;assujettissement</p>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{effectifAssujLegacy} sal.</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Quota légal (6%)</p>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{(effectifAssujLegacy * QUOTA_LEGAL).toFixed(2)} UB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#1A1A2E] border-b border-[#E2E8F0] pb-2">SMIC de référence</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label>SMIC horaire de référence (€)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <Info className="w-4 h-4 text-[#6B7280]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>SMIC horaire brut au 31 décembre de l&apos;année, tel que défini par l&apos;AGEFIPH.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input type="number" step="0.01" {...legacyForm.register('smic_horaire_ref', { valueAsNumber: true })} />
                    <p className="text-xs text-[#6B7280]">Valeur officielle pré-remplie pour {anneeActuelle}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <p className="text-xs text-[#6B7280]">Coefficient de contribution</p>
                    <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">{getCoefficientContribution(effectifAssujLegacy)} h — {coefficientLabel(effectifAssujLegacy)}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">400 h si &lt; 250 sal. · 500 h si 250–749 sal. · 600 h si ≥ 750 sal.</p>
                  </div>
                </div>

                <Button type="submit" disabled={savingOETH}>
                  {savingOETH && <Loader2 className="w-4 h-4 animate-spin" />}
                  Recalculer et sauvegarder
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Établissements — visible par tous ──────────────────────────────────── */}
      {etablissements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <div>
                  <CardTitle>Sites et établissements</CardTitle>
                  <CardDescription>
                    {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''} configuré{etablissements.length > 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              {isAdmin && (
                <Link href="/etablissements">
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
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
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {e.siret && <span className="text-xs text-[#6B7280]">SIRET : {e.siret}</span>}
                            {e.address && <span className="text-xs text-[#6B7280] truncate">{e.address}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-[#6B7280]">Effectif assuj.</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">
                            {effectifAss > 0 ? `${effectifAss} sal.` : <span className="text-[#CBD5E1] font-normal italic text-xs">non renseigné</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#6B7280]">Taux OETH</p>
                          <p className={`text-sm font-semibold ${effectifAss === 0 ? 'text-[#CBD5E1]' : taux >= 6 ? 'text-[#2E7D32]' : taux >= 3 ? 'text-[#BF5A00]' : 'text-[#B71C1C]'}`}>
                            {effectifAss === 0 ? '—' : `${taux.toFixed(1)} %`}
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

      {/* ── Zone de danger ────────────────────────────────────────────────────── */}
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
                et l&apos;accès à l&apos;organisation seront désactivés. Les données sont conservées 30 jours
                puis supprimées. Exportez vos données avant de continuer.
              </p>
            ) : (
              <p className="text-sm text-[#6B7280] mt-0.5">
                Cette action supprime <strong>uniquement votre accès</strong> à Talenth.
                Les données de l&apos;organisation ne sont pas affectées.
              </p>
            )}
          </div>
        </div>
        {!showDeleteConfirm ? (
          <Button
            type="button" variant="secondary"
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
              <Button type="button" disabled={deletingAccount} onClick={deleteAccount} className="bg-[#B71C1C] hover:bg-red-800 text-white">
                {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                Oui, supprimer mon compte
              </Button>
              <Button type="button" variant="secondary" disabled={deletingAccount} onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
