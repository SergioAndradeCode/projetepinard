'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Download, Wallet, TrendingDown, Calendar, Pencil, Trash2, Loader2, AlertCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { triggerExport } from '@/lib/excel/download'
import { createClient } from '@/lib/supabase/client'
import { useEstablishment } from '@/contexts/EstablishmentContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatEuros, formatDate } from '@/lib/utils'
import { calculerTauxBudget } from '@/lib/oeth/calculs'
import type { Establishment, BudgetAllocation, BudgetExpense, BudgetCategorie, ESATPurchase, RQTHEmployee } from '@/types'
import { BUDGET_CATEGORIES_LABELS } from '@/types'

const COULEURS = ['#1E4A8C', '#2E75B6', '#3B9CD9', '#2E7D32', '#BF5A00', '#7C3AED', '#6B7280']
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const RADIAN = Math.PI / 180
const renderPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 700, pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const depenseSchema = z.object({
  establishment_id: z.string().min(1, 'Établissement requis'),
  categorie: z.enum(['esat_ea', 'maintien_emploi', 'sensibilisation', 'communication', 'formation', 'prestations_externes', 'autres']),
  description: z.string().min(1, 'Description requise'),
  montant: z.number().positive('Montant > 0'),
  date_depense: z.string().min(1, 'Date requise'),
  facture_ref: z.string().nullable(),
  rqth_employee_id: z.string().nullable().optional(),
})
type DepenseForm = z.infer<typeof depenseSchema>

type DepenseConsolidee = BudgetExpense & { source: 'manuel' | 'esat' }

export default function BudgetPage() {
  const supabase = useMemo(() => createClient(), [])
  const anneeCourante = new Date().getFullYear()
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(anneeCourante)
  const anneesDisponibles = Array.from({ length: 4 }, (_, i) => anneeCourante - 2 + i)
  const { selectedEstablishmentId } = useEstablishment()

  const [orgId, setOrgId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('lecteur')
  const [profileEstablishmentId, setProfileEstablishmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [depenses, setDepenses] = useState<BudgetExpense[]>([])
  const [achatsESAT, setAchatsESAT] = useState<ESATPurchase[]>([])

  const [showAddDepense, setShowAddDepense] = useState(false)
  const [editDepense, setEditDepense] = useState<BudgetExpense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editAllocModal, setEditAllocModal] = useState<{
    siteId: string | null
    name: string
    currentValue: number
  } | null>(null)
  const [editAllocValue, setEditAllocValue] = useState('')
  const [savingAlloc, setSavingAlloc] = useState(false)
  const [savingDepense, setSavingDepense] = useState(false)
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [exporting, setExporting] = useState(false)
  const [salariesBoeth, setSalariesBoeth] = useState<RQTHEmployee[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<DepenseForm>({
    resolver: zodResolver(depenseSchema),
    defaultValues: { categorie: 'sensibilisation', montant: undefined, establishment_id: '', facture_ref: null },
  })
  const montantWatch = watch('montant')

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, establishment_id')
      .eq('id', user.id)
      .single()
    if (!profile?.organization_id) return
    setOrgId(profile.organization_id)
    setRole(profile.role)
    const estabId = profile.establishment_id ?? null
    setProfileEstablishmentId(estabId)

    // Rôles restreints à leur établissement
    const SCOPED_ROLES = ['charge_mission', 'lecteur']
    const isScoped = SCOPED_ROLES.includes(profile.role ?? '')
    const scopedId = isScoped ? estabId : null

    let depQuery = supabase
      .from('budget_expenses').select('*').eq('organization_id', profile.organization_id)
      .gte('date_depense', `${anneeSelectionnee}-01-01`)
      .lte('date_depense', `${anneeSelectionnee}-12-31`)
      .order('date_depense', { ascending: false })
    if (scopedId) depQuery = depQuery.eq('establishment_id', scopedId)

    let esatQuery = supabase
      .from('esat_purchases').select('*').eq('organization_id', profile.organization_id)
      .gte('date_facture', `${anneeSelectionnee}-01-01`)
      .lte('date_facture', `${anneeSelectionnee}-12-31`)
    if (scopedId) esatQuery = esatQuery.eq('establishment_id', scopedId)

    let allocQuery = supabase
      .from('budget_allocations').select('*').eq('organization_id', profile.organization_id).eq('annee', anneeSelectionnee)
    if (scopedId) allocQuery = allocQuery.eq('establishment_id', scopedId)

    let boethQuery = supabase.from('rqth_employees').select('id, prenom, nom, matricule, service')
      .eq('organization_id', profile.organization_id)
      .order('nom').order('prenom')
    if (scopedId) boethQuery = boethQuery.eq('establishment_id', scopedId)

    const [sitesRes, allocRes, depRes, esatRes, boethRes] = await Promise.all([
      supabase.from('establishments').select('*').eq('organization_id', profile.organization_id)
        .order('is_headquarters', { ascending: false }).order('name'),
      allocQuery,
      depQuery,
      esatQuery,
      boethQuery,
    ])

    if (sitesRes.status === 404 || allocRes.status === 404 || depRes.status === 404) {
      setDbError(true)
      setLoading(false)
      return
    }

    setEtablissements(sitesRes.data ?? [])
    setAllocations(allocRes.data ?? [])
    setDepenses(depRes.data ?? [])
    setAchatsESAT(esatRes.data ?? [])
    setSalariesBoeth((boethRes.data ?? []) as RQTHEmployee[])
    setLoading(false)
  }, [supabase, anneeSelectionnee])

  useEffect(() => { loadData() }, [loadData])

  // ── Données dérivées ─────────────────────────────────────────────────────────
  const toutesDepenses: DepenseConsolidee[] = useMemo(() => {
    const esatRows: DepenseConsolidee[] = achatsESAT.map(a => ({
      id: a.id,
      organization_id: a.organization_id,
      establishment_id: a.establishment_id ?? null,
      categorie: 'esat_ea' as BudgetCategorie,
      montant: a.montant_ht,
      description: `Achat ESAT/EA — ${a.fournisseur}`,
      date_depense: a.date_facture,
      facture_ref: null,
      created_at: a.created_at,
      source: 'esat',
    }))
    return [
      ...depenses.map(d => ({ ...d, source: 'manuel' as const })),
      ...esatRows,
    ].sort((a, b) => new Date(b.date_depense).getTime() - new Date(a.date_depense).getTime())
  }, [depenses, achatsESAT])

  // Modèle d'allocation : enveloppe globale (establishment_id = null) → distribution par sites
  const globalEnvelope = allocations.find(a => a.establishment_id === null)?.montant_total ?? 0
  const sumSiteAllocs = allocations
    .filter(a => a.establishment_id !== null)
    .reduce((s, a) => s + a.montant_total, 0)
  const nonDistribue = globalEnvelope - sumSiteAllocs
  const isOverAllocated = globalEnvelope > 0 && sumSiteAllocs > globalEnvelope
  const pctDistribue = globalEnvelope > 0 ? Math.min((sumSiteAllocs / globalEnvelope) * 100, 100) : 0

  // Budget de référence selon la vue
  const budgetRef = selectedEstablishmentId
    ? (allocations.find(a => a.establishment_id === selectedEstablishmentId)?.montant_total ?? 0)
    : globalEnvelope

  // Dépenses filtrées par le contexte d'établissement
  const depensesContextuelles = useMemo(() =>
    toutesDepenses.filter(d =>
      !selectedEstablishmentId || d.establishment_id === selectedEstablishmentId
    ),
    [toutesDepenses, selectedEstablishmentId]
  )

  const totalDepenses = depensesContextuelles.reduce((s, d) => s + d.montant, 0)
  const budgetRestant = budgetRef - totalDepenses
  const tauxConso = calculerTauxBudget(totalDepenses, budgetRef)
  const moisActuel = new Date().getMonth()
  const depensesMois = depensesContextuelles
    .filter(d =>
      new Date(d.date_depense).getMonth() === moisActuel &&
      new Date(d.date_depense).getFullYear() === anneeSelectionnee
    )
    .reduce((s, d) => s + d.montant, 0)

  const parCategorie = Object.entries(BUDGET_CATEGORIES_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: depensesContextuelles.filter(d => d.categorie === key).reduce((s, d) => s + d.montant, 0),
      key,
    }))
    .filter(c => c.value > 0)

  const parMois = MOIS.map((mois, i) => ({
    mois,
    Dépenses: depensesContextuelles
      .filter(d => new Date(d.date_depense).getMonth() === i)
      .reduce((s, d) => s + d.montant, 0),
    'Budget mensuel': budgetRef > 0 ? Math.round(budgetRef / 12) : 0,
  }))

  // Tableau filtré (par catégorie uniquement — le site est géré par le contexte)
  const depensesFiltrees = depensesContextuelles.filter(d =>
    filtreCategorie === 'tous' || d.categorie === filtreCategorie
  )

  // charge_mission local peut gérer les dépenses de son établissement
  const canEdit = role === 'admin' || role === 'charge_site' || role === 'charge_mission'
  const isLocked = !!profileEstablishmentId

  // ── Actions ──────────────────────────────────────────────────────────────────
  const saveAllocation = async () => {
    if (!orgId || !editAllocModal) return
    setSavingAlloc(true)
    const montant = parseFloat(editAllocValue)
    if (isNaN(montant) || montant < 0) { toast.error('Montant invalide'); setSavingAlloc(false); return }
    const existing = allocations.find(a => a.establishment_id === editAllocModal.siteId)
    const payload = { organization_id: orgId, establishment_id: editAllocModal.siteId, annee: anneeSelectionnee, montant_total: montant }
    const { error } = existing
      ? await supabase.from('budget_allocations').update({ montant_total: montant }).eq('id', existing.id)
      : await supabase.from('budget_allocations').insert(payload)
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Budget mis à jour'); loadData() }
    setEditAllocModal(null)
    setEditAllocValue('')
    setSavingAlloc(false)
  }

  const openAddDepense = () => {
    setEditDepense(null)
    // Priorité : établissement du profil (local) > contexte global > site unique
    const defaultEtab = profileEstablishmentId
      ?? selectedEstablishmentId
      ?? (etablissements.length === 1 ? etablissements[0].id : '')
    reset({
      categorie: 'sensibilisation',
      montant: undefined,
      establishment_id: defaultEtab,
      facture_ref: null,
      rqth_employee_id: null,
    })
    setShowAddDepense(true)
  }

  const onSubmitDepense = async (data: DepenseForm) => {
    if (!orgId) return
    setSavingDepense(true)
    const payload = {
      ...data,
      facture_ref: data.facture_ref || null,
      rqth_employee_id: data.rqth_employee_id || null,
      organization_id: orgId,
    }
    const { error } = editDepense
      ? await supabase.from('budget_expenses').update(payload).eq('id', editDepense.id)
      : await supabase.from('budget_expenses').insert(payload)
    if (error) toast.error('Erreur : ' + error.message)
    else {
      toast.success(editDepense ? 'Dépense modifiée' : 'Dépense ajoutée')
      setShowAddDepense(false)
      setEditDepense(null)
      reset()
      loadData()
    }
    setSavingDepense(false)
  }

  const openEdit = (d: BudgetExpense) => {
    setEditDepense(d)
    reset({
      categorie: d.categorie,
      description: d.description,
      montant: d.montant,
      date_depense: d.date_depense,
      facture_ref: d.facture_ref,
      establishment_id: d.establishment_id ?? '',
      rqth_employee_id: d.rqth_employee_id ?? null,
    })
    setShowAddDepense(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('budget_expenses').delete().eq('id', deleteId)
    if (error) toast.error('Erreur : ' + error.message)
    else { toast.success('Dépense supprimée'); loadData() }
    setDeleteId(null)
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      await triggerExport({
        type: 'budget',
        data: { orgName: '', year: anneeSelectionnee, etablissements, allocations, expenses: depenses },
        filename: `Talenth_Budget_${anneeSelectionnee}.xlsx`,
      })
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 w-full">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-[#BF5A00] mb-4" />
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">Tables non initialisées</h2>
        <p className="text-sm text-[#6B7280] mb-4">
          Les tables <code className="bg-[#F8FAFC] px-1 rounded">budget_allocations</code> et{' '}
          <code className="bg-[#F8FAFC] px-1 rounded">budget_expenses</code> n&apos;existent pas encore.
          Exécutez les migrations SQL dans le SQL Editor Supabase.
        </p>
        <p className="text-xs text-[#6B7280]">Fichier : <code>supabase/migrations_v2.sql</code></p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">

      {/* ── Sélecteur d'année ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Budget</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Suivi des dépenses OETH — exercice {anneeSelectionnee}</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setAnneeSelectionnee(a => Math.max(a - 1, anneeCourante - 5))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#1A1A2E] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {anneesDisponibles.map(a => (
            <button
              key={a}
              onClick={() => setAnneeSelectionnee(a)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                a === anneeSelectionnee
                  ? 'bg-[#1E4A8C] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#1A1A2E]'
              }`}
            >
              {a}
              {a === anneeCourante && a !== anneeSelectionnee && (
                <span className="ml-1 text-[9px] text-[#9CA3AF]">●</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setAnneeSelectionnee(a => Math.min(a + 1, anneeCourante + 2))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#1A1A2E] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Cartes résumé ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#EBF2FA] rounded-xl flex items-center justify-center shrink-0">
                <Wallet className="w-4.5 h-4.5 text-[#1E4A8C]" />
              </div>
              <p className="text-sm font-medium text-[#6B7280]">Budget consommé</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{formatEuros(totalDepenses)}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">sur {formatEuros(budgetRef)} alloués</p>
            <div className="mt-3 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${tauxConso >= 90 ? 'bg-[#B71C1C]' : tauxConso >= 70 ? 'bg-[#BF5A00]' : 'bg-[#2E7D32]'}`}
                style={{ width: `${Math.min(tauxConso, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-1">{tauxConso.toFixed(0)}% consommé</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${budgetRestant < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <TrendingDown className={`w-4.5 h-4.5 ${budgetRestant < 0 ? 'text-[#B71C1C]' : 'text-[#2E7D32]'}`} />
              </div>
              <p className="text-sm font-medium text-[#6B7280]">Budget restant</p>
            </div>
            <p className={`text-2xl font-bold ${budgetRestant < 0 ? 'text-[#B71C1C]' : 'text-[#2E7D32]'}`}>
              {formatEuros(budgetRestant)}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">{(100 - tauxConso).toFixed(0)}% disponible</p>
            {budgetRef === 0 && canEdit && role === 'admin' && (
              <button
                className="mt-2 text-xs text-[#1E4A8C] underline underline-offset-2"
                onClick={() => {
                  setEditAllocModal({ siteId: null, name: "Enveloppe globale entreprise", currentValue: 0 })
                  setEditAllocValue('')
                }}
              >
                Définir l&apos;enveloppe budgétaire →
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5 text-[#BF5A00]" />
              </div>
              <p className="text-sm font-medium text-[#6B7280]">Dépenses ce mois</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{formatEuros(depensesMois)}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {anneeSelectionnee === anneeCourante ? `${MOIS[moisActuel]} ${anneeSelectionnee}` : `Exercice ${anneeSelectionnee}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section allocation (admin, vue globale) ────────────────────────── */}
      {role === 'admin' && !selectedEstablishmentId && etablissements.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[16px]">Répartition du budget {anneeSelectionnee}</CardTitle>
              <Button
                variant="outline" size="sm" className="text-xs h-8"
                onClick={() => {
                  setEditAllocModal({ siteId: null, name: "Enveloppe globale entreprise", currentValue: globalEnvelope })
                  setEditAllocValue(String(globalEnvelope || ''))
                }}
              >
                {globalEnvelope > 0 ? 'Modifier l\'enveloppe' : 'Définir l\'enveloppe'}
              </Button>
            </div>

            {/* Enveloppe globale + barre de distribution */}
            <div className="mt-3 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium">Enveloppe globale</p>
                  <p className="text-xl font-bold text-[#1A1A2E]">
                    {globalEnvelope > 0 ? formatEuros(globalEnvelope) : <span className="italic text-[#CBD5E1] text-base font-normal">Non définie</span>}
                  </p>
                </div>
                {globalEnvelope > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Non distribué</p>
                    <p className={`text-base font-semibold ${nonDistribue < 0 ? 'text-[#B71C1C]' : 'text-[#2E7D32]'}`}>
                      {formatEuros(Math.abs(nonDistribue))}
                      {nonDistribue < 0 && ' de trop'}
                    </p>
                  </div>
                )}
              </div>
              {globalEnvelope > 0 && (
                <>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverAllocated ? 'bg-[#B71C1C]' : pctDistribue >= 90 ? 'bg-[#BF5A00]' : 'bg-[#1E4A8C]'}`}
                      style={{ width: `${pctDistribue}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1.5">
                    {formatEuros(sumSiteAllocs)} distribués sur {formatEuros(globalEnvelope)} ({pctDistribue.toFixed(0)}%)
                  </p>
                </>
              )}
            </div>

            {/* Alerte sur-allocation */}
            {isOverAllocated && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-[#B71C1C] shrink-0" />
                <p className="text-sm text-[#B71C1C]">
                  Attention : la somme des allocations par site ({formatEuros(sumSiteAllocs)}) dépasse l&apos;enveloppe globale ({formatEuros(globalEnvelope)}).
                </p>
              </div>
            )}
          </CardHeader>

          {/* Tableau de répartition par site */}
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {['Établissement', 'Alloué', 'Dépensé', 'Restant', 'Consommation', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {etablissements.map(site => {
                  const alloc = allocations.find(a => a.establishment_id === site.id)?.montant_total ?? 0
                  // Inclut les dépenses manuelles ET les achats ESAT/EA pour ce site
                  const dep = toutesDepenses.filter(d => d.establishment_id === site.id).reduce((s, d) => s + d.montant, 0)
                  const taux = calculerTauxBudget(dep, alloc)
                  return (
                    <tr key={site.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">
                        {site.name}
                        {site.is_headquarters && (
                          <span className="ml-1.5 text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-1.5 py-0.5 rounded-full">Siège</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">
                        {alloc > 0 ? formatEuros(alloc) : <span className="italic text-[#CBD5E1]">Non alloué</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">{formatEuros(dep)}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${alloc > 0 && alloc - dep < 0 ? 'text-[#B71C1C]' : alloc > 0 ? 'text-[#2E7D32]' : 'text-[#6B7280]'}`}>
                        {alloc > 0 ? formatEuros(alloc - dep) : '—'}
                      </td>
                      <td className="px-4 py-3 w-36">
                        {alloc > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${taux >= 90 ? 'bg-[#B71C1C]' : taux >= 70 ? 'bg-[#BF5A00]' : 'bg-[#2E7D32]'}`}
                                style={{ width: `${Math.min(taux, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#6B7280] shrink-0 w-9 text-right">{taux.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#CBD5E1]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost" size="sm" className="h-7 text-xs text-[#1E4A8C] px-2"
                          onClick={() => {
                            setEditAllocModal({ siteId: site.id, name: site.name, currentValue: alloc })
                            setEditAllocValue(String(alloc || ''))
                          }}
                        >
                          {alloc > 0 ? 'Modifier' : 'Allouer'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                  <td className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total dépensé</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#1A1A2E]">{formatEuros(globalEnvelope)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#1A1A2E]">{formatEuros(toutesDepenses.reduce((s, d) => s + d.montant, 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ── Graphiques ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {parCategorie.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-[#6B7280]">Aucune dépense enregistrée</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <PieChart>
                  <Pie
                    data={parCategorie}
                    dataKey="value"
                    cx="50%" cy="45%"
                    outerRadius={95} innerRadius={45}
                    paddingAngle={3}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {parCategorie.map((_, i) => (
                      <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [formatEuros(Number(v)), name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Legend
                    iconSize={9}
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 12, fontSize: 11, lineHeight: '20px' }}
                    formatter={(v) => <span style={{ color: '#6B7280' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Évolution mensuelle {anneeSelectionnee}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart data={parMois} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v}€`}
                  axisLine={false} tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [formatEuros(Number(v)), '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Legend
                  iconSize={9}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                  formatter={(v) => <span style={{ color: '#6B7280' }}>{v}</span>}
                />
                <Bar dataKey="Dépenses" fill="#1E4A8C" radius={[4, 4, 0, 0]} />
                {budgetRef > 0 && (
                  <Bar dataKey="Budget mensuel" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Tableau des dépenses ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-[16px]">
              Dépenses
              <span className="ml-2 text-sm font-normal text-[#6B7280]">({depensesFiltrees.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filtreCategorie} onValueChange={setFiltreCategorie}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes catégories</SelectItem>
                  {Object.entries(BUDGET_CATEGORIES_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportExcel} disabled={exporting}>
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Excel
              </Button>
              {canEdit && (
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openAddDepense}>
                  <Plus className="w-3.5 h-3.5" />Ajouter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {depensesFiltrees.length === 0 ? (
            <div className="py-14 text-center text-[#6B7280] text-sm">
              {toutesDepenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucune dépense pour ce filtre'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {['Date', 'Site', 'Catégorie', 'Description', 'Bénéficiaire BOETH', 'Montant', 'Réf. facture', ''].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide ${i >= 5 ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {depensesFiltrees.map(d => (
                    <tr key={d.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{formatDate(d.date_depense)}</td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">
                        {etablissements.find(e => e.id === d.establishment_id)?.name ?? (
                          <span className="italic text-[#CBD5E1]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-[#EBF2FA] text-[#1E4A8C] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {BUDGET_CATEGORIES_LABELS[d.categorie]}
                        </span>
                        {d.source === 'esat' && (
                          <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">Auto</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1A1A2E] max-w-[180px] truncate">{d.description}</td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">
                        {d.rqth_employee_id ? (() => {
                          const emp = salariesBoeth.find(s => s.id === d.rqth_employee_id)
                          return emp
                            ? <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {emp.prenom} {emp.nom}
                              </span>
                            : <span className="italic text-[#CBD5E1]">—</span>
                        })() : <span className="italic text-[#CBD5E1]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1A1A2E] text-right whitespace-nowrap">{formatEuros(d.montant)}</td>
                      <td className="px-4 py-3 text-sm text-[#6B7280] text-right">{d.facture_ref ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && (
                          d.source === 'esat' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                              <ArrowRight className="w-3 h-3" />
                              Onglet ESAT
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => openEdit(d as BudgetExpense)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 hover:text-[#B71C1C] hover:bg-red-50"
                                onClick={() => setDeleteId(d.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total affiché</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#1A1A2E] text-right">
                      {formatEuros(depensesFiltrees.reduce((s, d) => s + d.montant, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal allocation (enveloppe globale ou site) ─────────────────────── */}
      <Dialog open={!!editAllocModal} onOpenChange={(v) => { if (!v) { setEditAllocModal(null); setEditAllocValue('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editAllocModal?.siteId === null
                ? `Enveloppe budgétaire ${anneeSelectionnee}`
                : `Budget — ${editAllocModal?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {editAllocModal?.siteId === null && (
              <p className="text-sm text-[#6B7280]">
                L&apos;enveloppe globale représente le budget total de l&apos;entreprise. Elle est ensuite distribuée par établissement.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Montant (€)</Label>
              <Input
                type="number" min={0} step="0.01"
                value={editAllocValue}
                onChange={e => setEditAllocValue(e.target.value)}
                placeholder="ex : 50 000"
                autoFocus
              />
              {editAllocModal?.siteId !== null && globalEnvelope > 0 && (
                <p className="text-xs text-[#6B7280]">
                  Enveloppe globale : {formatEuros(globalEnvelope)} — déjà distribué : {formatEuros(sumSiteAllocs)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditAllocModal(null); setEditAllocValue('') }}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={saveAllocation} disabled={savingAlloc}>
                {savingAlloc && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal ajout / édition dépense ───────────────────────────────────── */}
      <Dialog
        open={showAddDepense}
        onOpenChange={(v) => { if (!v) { setShowAddDepense(false); setEditDepense(null); reset() } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDepense ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitDepense)} className="space-y-4 mt-2">

            {/* Établissement : obligatoire */}
            <div className="space-y-1.5">
              <Label>
                Établissement <span className="text-[#B71C1C]">*</span>
              </Label>
              {isLocked ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#EBF2FA] border border-[#1E4A8C]/20 text-sm text-[#1E4A8C]">
                  {etablissements.find(e => e.id === profileEstablishmentId)?.name ?? 'Mon site'}
                </div>
              ) : (
                <Select
                  value={watch('establishment_id') || undefined}
                  onValueChange={v => setValue('establishment_id', v)}
                >
                  <SelectTrigger className={errors.establishment_id ? 'border-[#B71C1C]' : ''}>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {etablissements.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.is_headquarters ? ' — Siège' : ''}
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
              <Label>Catégorie <span className="text-[#B71C1C]">*</span></Label>
              <Select
                value={watch('categorie')}
                onValueChange={v => setValue('categorie', v as BudgetCategorie)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BUDGET_CATEGORIES_LABELS)
                    .filter(([k]) => k !== 'esat_ea')
                    .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-[#B71C1C]">*</span></Label>
              <Input placeholder="ex : Formation sensibilisation handicap" {...register('description')} />
              {errors.description && <p className="text-xs text-[#B71C1C]">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Montant HT (€) <span className="text-[#B71C1C]">*</span></Label>
                <Input type="number" step="0.01" min={0} placeholder="0,00" {...register('montant', { valueAsNumber: true })} />
                {errors.montant && <p className="text-xs text-[#B71C1C]">{errors.montant.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date <span className="text-[#B71C1C]">*</span></Label>
                <Input type="date" {...register('date_depense')} />
                {errors.date_depense && <p className="text-xs text-[#B71C1C]">{errors.date_depense.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Réf. facture <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
              <Input placeholder="ex : FAC-2025-042" {...register('facture_ref')} />
            </div>

            {salariesBoeth.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Bénéficiaire BOETH{' '}
                  <span className="text-[#6B7280] font-normal">(optionnel)</span>
                </Label>
                <Select
                  value={watch('rqth_employee_id') ?? '__none__'}
                  onValueChange={v => setValue('rqth_employee_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Associer à un collaborateur…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Aucun —</SelectItem>
                    {salariesBoeth.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.prenom} {s.nom}{s.matricule ? ` · #${s.matricule}` : ''}{s.service ? ` — ${s.service}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#9CA3AF]">
                  Permet de tracer le matériel ou aménagement acquis pour ce collaborateur.
                </p>
              </div>
            )}

            {montantWatch > 0 && (
              <div className="p-3 bg-[#F8FAFC] rounded-lg flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Montant</span>
                <span className="text-sm font-semibold text-[#1A1A2E]">{formatEuros(montantWatch)}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button" variant="secondary" className="flex-1"
                onClick={() => { setShowAddDepense(false); setEditDepense(null); reset() }}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={savingDepense}>
                {savingDepense && <Loader2 className="w-4 h-4 animate-spin" />}
                {editDepense ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal suppression ────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer cette dépense ?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6B7280]">Cette action est irréversible.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
