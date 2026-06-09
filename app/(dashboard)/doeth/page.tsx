'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CheckCircle, ChevronRight, ChevronLeft, FileDown, RotateCcw,
  AlertTriangle, Loader2, Info, ChevronDown, ChevronUp,
  Building2, Users, Calculator, FileText, BadgeCheck, Receipt,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/contexts/ProfileContext'
import { toast } from 'sonner'
import { triggerExport } from '@/lib/excel/download'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEuros } from '@/lib/utils'
import {
  calculerUBRQTHPourAnnee,
  filtrerSalariesPourAnnee,
  getUBProratee,
  getMoisPresencePourAnnee,
  getCoeffAge,
  QUOTA_LEGAL,
  getCoefficientContribution,
  getSmicRef,
} from '@/lib/oeth/calculs'
import type { Establishment, RQTHEmployee, ESATPurchase } from '@/types'
import { LABEL_RECONNAISSANCE } from '@/types'

const ANNEES = [new Date().getFullYear() - 1, new Date().getFullYear() - 2, new Date().getFullYear() - 3]
const ETAPES = [
  { label: 'Année', icon: FileText },
  { label: 'Établissements', icon: Building2 },
  { label: 'Unités bénéficiaires', icon: Users },
  { label: 'Contribution', icon: Calculator },
  { label: 'Export DSN', icon: FileDown },
]

function InfoBox({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'orange' | 'green' | 'gray' }) {
  const colors = {
    blue: 'bg-[#EBF2FA] border-[#1E4A8C]/20 text-[#1E4A8C]',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    gray: 'bg-[#F8FAFC] border-[#E2E8F0] text-[#6B7280]',
  }
  return (
    <div className={`flex gap-2.5 p-3.5 rounded-lg border text-sm ${colors[color]}`}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export default function DoethPage() {
  const supabase = useMemo(() => createClient(), [])
  const { orgId } = useProfile()   // profil chargé une fois dans le layout, pas de re-fetch
  const [step, setStep] = useState(0)
  const [annee, setAnnee] = useState(ANNEES[0])
  const [orgName, setOrgName] = useState('')
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [salaries, setSalaries] = useState<RQTHEmployee[]>([])
  const [achats, setAchats] = useState<ESATPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [oethSettings, setOethSettings] = useState<{ smic_horaire_ref: number; effectif_brut?: number; effectif_ecap?: number; effectif_assujettissement?: number } | null>(null)
  const [stagiaires, setStagiaires] = useState(0)
  // deductionESAT est calculé automatiquement depuis le tableau des achats de l'année
  // deductionESATManuel est le fallback si aucun achat n'est enregistré
  const [deductionESATManuel, setDeductionESATManuel] = useState(0)
  const [attestationsLocales, setAttestationsLocales] = useState<Record<string, number | ''>>({})
  const [showAchatsDetail, setShowAchatsDetail] = useState(false)
  const [savingAttestation, setSavingAttestation] = useState<string | null>(null)
  const [deductionAccords, setDeductionAccords] = useState(0)
  const [deductionAutres, setDeductionAutres] = useState(0)
  const [showDetail, setShowDetail] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    // Utilise l'orgId du ProfileContext — évite getUser() + profiles.select() redondants
    const resolvedOrgId = orgId ?? await (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: p } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      return p?.organization_id ?? null
    })()
    if (!resolvedOrgId) { setLoading(false); return }
    const [orgRes, sitesRes, salRes, achRes, settingsRes] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', resolvedOrgId).single(),
      supabase.from('establishments').select('*').eq('organization_id', resolvedOrgId),
      supabase.from('rqth_employees').select('*').eq('organization_id', resolvedOrgId),
      supabase.from('esat_purchases').select('*').eq('organization_id', resolvedOrgId),
      supabase.from('oeth_settings').select('smic_horaire_ref, effectif_brut, effectif_ecap, effectif_assujettissement').eq('organization_id', resolvedOrgId).eq('annee', annee).maybeSingle(),
    ])
    if (sitesRes.status === 404) { setDbError(true); setLoading(false); return }
    setOrgName(orgRes.data?.name ?? '')
    setEtablissements(sitesRes.data ?? [])
    setSalaries(salRes.data ?? [])
    setOethSettings(settingsRes.data ?? null)
    const ach = achRes.data ?? []
    setAchats(ach)
    // Initialiser les attestations locales depuis les valeurs déjà saisies en base
    const initAtt: Record<string, number | ''> = {}
    ach.forEach(a => { if (a.montant_attestation != null) initAtt[a.id] = a.montant_attestation })
    setAttestationsLocales(initAtt)
    setLoading(false)
  }, [supabase, annee, orgId])

  useEffect(() => { loadData() }, [loadData])

  // ─── Calculs pour l'année sélectionnée ─────────────────────────────────────
  const smicRef = oethSettings?.smic_horaire_ref ?? getSmicRef(annee)

  // Règle unique : établissements = source de vérité pour l'effectif.
  // Fallback sur oeth_settings si aucun établissement n'a d'effectif renseigné.
  const totalBrutSites = etablissements.reduce((s, e) => s + (e.effectif_brut || e.effectif_assujettissement || 0), 0)
  const totalEcapSites = etablissements.reduce((s, e) => s + (e.effectif_ecap || 0), 0)
  const effectifBrutTotal = totalBrutSites > 0
    ? totalBrutSites
    : (oethSettings?.effectif_brut || oethSettings?.effectif_assujettissement || 0)
  const ecapTotal = totalBrutSites > 0
    ? totalEcapSites
    : (oethSettings?.effectif_ecap || 0)
  const effectifTotal = Math.max(0, effectifBrutTotal - ecapTotal)
  const coefficient = getCoefficientContribution(effectifTotal)

  const salariesAnnee = useMemo(() => filtrerSalariesPourAnnee(salaries, annee), [salaries, annee])
  const ubRQTH = useMemo(() => calculerUBRQTHPourAnnee(salariesAnnee, annee), [salariesAnnee, annee])

  // Achats ESAT/EA filtrés sur l'année de déclaration
  const achatsAnnee = useMemo(
    () => achats.filter(a => new Date(a.date_facture).getFullYear() === annee),
    [achats, annee]
  )

  // Déduction par achat : attestation officielle si saisie, sinon estimation 30% HT
  const deductionParAchat = useMemo(
    () => achatsAnnee.map(a => {
      const att = attestationsLocales[a.id]
      const hasAttestation = att !== undefined && att !== ''
      return {
        ...a,
        hasAttestation,
        deductionRetenue: hasAttestation ? Number(att) : Math.round(a.montant_ht * 0.3),
      }
    }),
    [achatsAnnee, attestationsLocales]
  )

  // Déduction EA/ESAT totale : calculée depuis le tableau si des achats existent, sinon saisie manuelle
  const deductionESAT = achatsAnnee.length > 0
    ? deductionParAchat.reduce((sum, a) => sum + a.deductionRetenue, 0)
    : deductionESATManuel

  // Sauvegarde d'une attestation en base (à l'événement onBlur de l'input)
  const saveAttestation = useCallback(async (id: string, val: number | '') => {
    setSavingAttestation(id)
    const montant = val === '' ? null : Number(val)
    const { error } = await supabase
      .from('esat_purchases')
      .update({ montant_attestation: montant })
      .eq('id', id)
    if (error) toast.error("Erreur lors de l'enregistrement de l'attestation")
    setSavingAttestation(null)
  }, [supabase])
  const ubStagiaires = stagiaires * 1
  const ubTotales = ubRQTH + ubStagiaires
  const quotaTheorique = effectifTotal * QUOTA_LEGAL
  const deficit = Math.max(0, quotaTheorique - ubTotales)
  const contributionBrute = deficit * coefficient * smicRef
  const totalAchatsESAT = achatsAnnee.reduce((s, a) => s + a.montant_ht, 0)
  const tauxActuel = effectifTotal > 0 ? (ubTotales / effectifTotal) * 100 : 0
  const plafondDeductionESAT = contributionBrute * (tauxActuel >= 3 ? 0.75 : 0.5)
  const deductionESATAppliquee = Math.min(deductionESAT, plafondDeductionESAT)
  const deductionsTotales = deductionESATAppliquee + deductionAccords + deductionAutres
  const contributionNette = Math.max(0, contributionBrute - deductionsTotales)
  const conforme = ubTotales >= quotaTheorique

  // UB par type de reconnaissance (proratisées)
  const ubParType = Object.entries(LABEL_RECONNAISSANCE).map(([type, label]) => {
    const sal = salariesAnnee.filter(s => s.type_reconnaissance === type)
    const ub = sal.reduce((sum, s) => sum + getUBProratee(s, annee), 0)
    return { type, label: label.split(', ')[0], labelLong: label, nb: sal.length, ub }
  }).filter(r => r.nb > 0)

  // Mode d'acquittement DSN
  const modeAcquittement = useMemo(() => {
    if (conforme && deductionAccords === 0) {
      return { code: '10', label: 'Emploi direct exclusif', desc: 'Taux d\'emploi ≥ 6%, aucune contribution due', color: 'green' as const }
    }
    if (conforme && deductionAccords > 0) {
      return { code: '30', label: 'Emploi direct + accord collectif', desc: 'Taux ≥ 6% et accord agréé actif', color: 'green' as const }
    }
    if (!conforme && contributionNette === 0 && deductionAccords > 0) {
      return { code: '30', label: 'Accord collectif agréé', desc: 'La contribution est couverte intégralement par l\'accord agréé DREETS', color: 'blue' as const }
    }
    if (!conforme && contributionNette > 0 && deductionESATAppliquee > 0 && deductionAccords > 0) {
      return { code: '80', label: 'Contribution + sous-traitance + accord', desc: 'Contribution partielle après déductions ESAT et accord', color: 'orange' as const }
    }
    if (!conforme && contributionNette > 0 && deductionESATAppliquee > 0) {
      return { code: '60', label: 'Contribution + sous-traitance ESAT/EA', desc: 'Contribution due à l\'AGEFIPH, après déduction sous-traitance', color: 'orange' as const }
    }
    if (!conforme && contributionNette > 0 && deductionAccords > 0) {
      return { code: '90', label: 'Contribution + accord collectif', desc: 'Contribution partielle malgré l\'accord agréé', color: 'orange' as const }
    }
    if (!conforme && contributionNette === 0 && deductionESATAppliquee > 0) {
      return { code: '60', label: 'Sous-traitance, contribution nulle', desc: 'Les déductions ESAT/EA couvrent l\'intégralité de la contribution brute', color: 'green' as const }
    }
    return { code: '50', label: 'Contribution pécuniaire', desc: 'Contribution à verser à l\'AGEFIPH via la DSN d\'avril', color: 'orange' as const }
  }, [conforme, contributionNette, deductionESATAppliquee, deductionAccords])

  const exportExcel = async () => {
    setExporting(true)
    try {
      await triggerExport({
        type: 'doeth',
        data: { orgName, annee, etablissements, salaries, achats, stagiaires, deductionESAT, deductionAccords, deductionAutres, ecapTotal },
        filename: `Talenth_DOETH_${orgName}_${annee}.xlsx`,
      })
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="space-y-4 w-full max-w-4xl"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /></div>

  if (dbError) return (
    <div className="max-w-2xl">
      <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold text-amber-900">Migration requise</p>
          <p className="text-sm text-amber-800">
            Les tables v2 n&apos;existent pas encore. Exécutez le fichier{' '}
            <code className="bg-amber-100 px-1 rounded">supabase/migrations_v2.sql</code> dans l&apos;éditeur SQL
            de votre projet Supabase pour activer l&apos;assistant DOETH.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-4xl space-y-6">

      {/* Barre de progression */}
      <div className="flex items-center gap-1">
        {ETAPES.map(({ label }, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${i === step ? 'bg-[#EBF2FA] border border-[#1E4A8C]/30 text-[#1E4A8C]' : i < step ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white border border-[#E2E8F0] text-[#6B7280]'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${i === step ? 'bg-[#1E4A8C] text-white' : i < step ? 'bg-green-500 text-white' : 'bg-[#E2E8F0] text-[#6B7280]'}`}>
                {i < step ? <CheckCircle className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:block truncate">{label}</span>
            </div>
            {i < ETAPES.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-[#E2E8F0] shrink-0" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">

          {/* ── ÉTAPE 0 : Année ───────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Année de déclaration</h2>
                <p className="text-sm text-[#6B7280] mt-1">Préparez votre Déclaration Obligatoire d&apos;Emploi des Travailleurs Handicapés</p>
              </div>

              <InfoBox color="blue">
                <p className="font-semibold">Qu&apos;est-ce que la DOETH ?</p>
                <p>
                  La DOETH est obligatoire pour toute entreprise d&apos;au moins 20 salariés. Elle est transmise
                  automatiquement via la <strong>DSN de paie d&apos;avril</strong> de l&apos;année suivante, votre logiciel
                  de paie l&apos;intègre à partir des données que vous lui fournissez.
                </p>
                <p>
                  Si votre taux d&apos;emploi BOETH est inférieur à <strong>6%</strong>, une contribution financière est
                  due à l&apos;AGEFIPH. Cet assistant calcule ce montant et prépare les données pour votre gestionnaire de paie.
                </p>
              </InfoBox>

              <div className="space-y-1.5">
                <Label>Année de référence</Label>
                <Select value={String(annee)} onValueChange={v => setAnnee(Number(v))}>
                  <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ANNEES.map(a => (
                      <SelectItem key={a} value={String(a)}>
                        DOETH {a}, à intégrer dans la DSN d&apos;avril {a + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Période couverte', value: `1er janv. ${annee}, 31 déc. ${annee}` },
                  { label: 'DSN concernée', value: `Paie d'avril ${annee + 1}` },
                  { label: 'Date limite', value: `5 mai ${annee + 1}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                    <p className="text-xs text-[#6B7280]">{label}</p>
                    <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 1 : Établissements ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Vérification par établissement</h2>
                <p className="text-sm text-[#6B7280] mt-1">Contrôlez l&apos;effectif d&apos;assujettissement de chaque site</p>
              </div>

              <InfoBox color="blue">
                <p className="font-semibold">L&apos;effectif d&apos;assujettissement</p>
                <p>
                  Il correspond au nombre de salariés pris en compte pour le calcul de l&apos;obligation OETH.
                  Il inclut tous les salariés en CDI, CDD et intérimaires (proratisés selon leur temps de présence),
                  mais <strong>exclut les apprentis, stagiaires, et certains contrats aidés</strong>.
                </p>
                <p>
                  Si ces chiffres semblent incorrects, corrigez-les dans <strong>Paramètres › Établissements</strong>.
                  Vérifiez également que le SIRET de chaque établissement est renseigné, il est requis dans la DSN.
                </p>
              </InfoBox>

              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      {['Établissement', 'SIRET', 'Effectif', 'UB RQTH', 'Taux BOETH'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-[#6B7280] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {etablissements.map(e => {
                      const sal = salariesAnnee.filter(x => x.establishment_id === e.id)
                      const ubR = calculerUBRQTHPourAnnee(sal, annee)
                      const taux = e.effectif_assujettissement > 0 ? (ubR / e.effectif_assujettissement) * 100 : 0
                      const siretManquant = !e.siret
                      return (
                        <tr key={e.id} className="bg-white">
                          <td className="px-3 py-2.5 text-sm font-medium text-[#1A1A2E]">
                            {e.name}
                            {e.is_headquarters && <span className="ml-2 text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-1.5 py-0.5 rounded">Siège</span>}
                          </td>
                          <td className="px-3 py-2.5 text-sm">
                            {siretManquant
                              ? <span className="text-[#B71C1C] font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Manquant</span>
                              : <span className="text-[#6B7280] font-mono text-xs">{e.siret}</span>
                            }
                          </td>
                          <td className="px-3 py-2.5 text-sm text-[#1A1A2E] font-medium">{e.effectif_assujettissement}</td>
                          <td className="px-3 py-2.5 text-sm text-[#1A1A2E]">{ubR.toFixed(2)}</td>
                          <td className={`px-3 py-2.5 text-sm font-semibold ${taux >= 6 ? 'text-[#2E7D32]' : taux >= 3 ? 'text-[#BF5A00]' : 'text-[#B71C1C]'}`}>
                            {taux.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                      <td className="px-3 py-2.5 text-sm font-bold text-[#1A1A2E]">TOTAL ENTREPRISE</td>
                      <td />
                      <td className="px-3 py-2.5 text-sm font-bold text-[#1A1A2E]">{effectifTotal}</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-[#1A1A2E]">{ubRQTH.toFixed(2)}</td>
                      <td className={`px-3 py-2.5 text-sm font-bold ${tauxActuel >= 6 ? 'text-[#2E7D32]' : 'text-[#BF5A00]'}`}>
                        {effectifTotal > 0 ? tauxActuel.toFixed(1) : 0}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {etablissements.some(e => !e.siret) && (
                <InfoBox color="orange">
                  <p className="font-semibold">SIRET manquant</p>
                  <p>Un ou plusieurs établissements n&apos;ont pas de SIRET renseigné. Ce numéro est <strong>obligatoire dans la DSN</strong>. Complétez-le dans Paramètres avant l&apos;export.</p>
                </InfoBox>
              )}

              <InfoBox color="gray">
                Depuis 2020, les achats EA/ESAT/TIH ne génèrent <strong>plus d&apos;UB</strong>. Ils génèrent une <strong>déduction monétaire</strong> sur la contribution brute (étape 4).
              </InfoBox>
            </div>
          )}

          {/* ── ÉTAPE 2 : UB détaillées ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Unités bénéficiaires</h2>
                <p className="text-sm text-[#6B7280] mt-1">Récapitulatif des UB comptabilisées pour {annee}</p>
              </div>

              <InfoBox color="blue">
                <p className="font-semibold">Comment sont calculées les UB ?</p>
                <p>
                  Une <strong>unité bénéficiaire (UB)</strong> représente l&apos;emploi d&apos;un travailleur handicapé à temps plein
                  pendant une année entière.
                </p>
                <p>
                  Formule : <code className="bg-[#1E4A8C]/10 px-1 rounded text-xs">(mois de présence dans {annee} / 12) × (taux d&apos;activité / 100)</code>
                </p>
                <p className="text-xs opacity-80">
                  Exemple : salarié RQTH à 80%, présent de juillet à décembre = 6/12 × 0,80 = <strong>0,40 UB</strong>.
                  Un mois commencé compte entier. Les reconnaissances expirées avant le 1er janvier {annee} sont exclues.
                </p>
              </InfoBox>

              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      {['Type de reconnaissance', 'Salariés actifs en ' + annee, 'UB proratisées'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {ubParType.map(({ type, label, nb, ub }) => (
                      <tr key={type} className={`bg-white ${nb === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3 text-sm text-[#1A1A2E]">{label}</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">{nb}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">{ub.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-white border-t border-dashed border-[#E2E8F0]">
                      <td className="px-4 py-3 text-sm text-[#1A1A2E]">Stagiaires / alternants handicapés</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input type="number" min={0} value={stagiaires} onChange={e => setStagiaires(Number(e.target.value))} className="w-20 h-7 text-sm" />
                          <span className="text-xs text-[#6B7280]">pers. × 1 UB</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">{ubStagiaires.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 ${conforme ? 'bg-green-50 border-green-200' : 'bg-[#EBF2FA] border-[#1E4A8C]/20'}`}>
                      <td className={`px-4 py-3 text-sm font-bold ${conforme ? 'text-[#2E7D32]' : 'text-[#1E4A8C]'}`}>TOTAL UB BOETH</td>
                      <td className={`px-4 py-3 text-sm ${conforme ? 'text-[#2E7D32]' : 'text-[#6B7280]'}`}>
                        {salariesAnnee.length} salarié{salariesAnnee.length > 1 ? 's' : ''} + {stagiaires} stagiaire{stagiaires > 1 ? 's' : ''}
                      </td>
                      <td className={`px-4 py-3 text-lg font-bold ${conforme ? 'text-[#2E7D32]' : 'text-[#1E4A8C]'}`}>
                        {ubTotales.toFixed(2)}
                        <span className="text-xs font-normal ml-1">/ {quotaTheorique.toFixed(2)} requis</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Détail par salarié (expandable) */}
              {salariesAnnee.length > 0 && (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-[#1A1A2E] hover:bg-[#EBF2FA] transition-colors"
                    onClick={() => setShowDetail(v => !v)}
                  >
                    <span>Détail par salarié ({salariesAnnee.length} BOETH présent{salariesAnnee.length > 1 ? 's' : ''} en {annee})</span>
                    {showDetail ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
                  </button>
                  {showDetail && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white border-b border-[#E2E8F0]">
                            {['Salarié', 'Établissement', 'Type', 'Validité reconnaissance', 'Mois', '% Tps', 'Coeff.', 'UB'].map(h => (
                              <th key={h} className="text-left px-3 py-2 font-medium text-[#6B7280] uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {salariesAnnee.map(s => {
                            const mois = getMoisPresencePourAnnee(s, annee)
                            const ub = getUBProratee(s, annee)
                            const etab = etablissements.find(e => e.id === s.establishment_id)
                            const debutFmt = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            const finFmt = s.est_permanent || !s.date_fin
                              ? 'Permanent'
                              : new Date(s.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            const expireDurantAnnee = !s.est_permanent && s.date_fin && new Date(s.date_fin) < new Date(annee + 1, 0, 1) && mois < 12
                            const coeffSenior = getCoeffAge(s.date_naissance, annee)
                            return (
                              <tr key={s.id} className="bg-white hover:bg-[#F8FAFC]">
                                <td className="px-3 py-2 font-medium text-[#1A1A2E]">{s.prenom} {s.nom}</td>
                                <td className="px-3 py-2 text-[#6B7280]">{etab?.name ?? '-'}</td>
                                <td className="px-3 py-2 text-[#6B7280]">{LABEL_RECONNAISSANCE[s.type_reconnaissance]?.split(', ')[0]}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 ${expireDurantAnnee ? 'text-orange-700' : 'text-[#6B7280]'}`}>
                                    {debutFmt} → {finFmt}
                                    {expireDurantAnnee && <span title="Reconnaissance expirée en cours d'année, comptée pro-rata">⚠</span>}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${mois === 12 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {mois}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-[#6B7280]">{s.taux_temps_travail ?? 100}%</td>
                                <td className="px-3 py-2 text-center">
                                  {coeffSenior === 1.5 ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                      ×1,5 50+
                                    </span>
                                  ) : (
                                    <span className="text-[#6B7280] text-[10px]">×1</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-semibold text-[#1A1A2E]">{ub.toFixed(3)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {totalAchatsESAT > 0 && (
                <InfoBox color="orange">
                  Vos <strong>{formatEuros(totalAchatsESAT)}</strong> d&apos;achats EA/ESAT/TIH ne génèrent <strong>pas d&apos;UB</strong> depuis la réforme 2020.
                  Ils seront convertis en <strong>déduction monétaire</strong> à l&apos;étape suivante.
                </InfoBox>
              )}
            </div>
          )}

          {/* ── ÉTAPE 3 : Contribution ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Calcul de la contribution</h2>
                <p className="text-sm text-[#6B7280] mt-1">Contribution brute, déductions applicables et montant net à verser</p>
              </div>

              {/* Formule de calcul */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-0.5">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-3">Formule de calcul</p>
                {[
                  ['Effectif d\'assujettissement total', `${effectifTotal} salariés`],
                  ['Quota légal BOETH (6%)', `${quotaTheorique.toFixed(2)} UB requises`],
                  ['Total UB BOETH comptabilisées', `${ubTotales.toFixed(2)} UB`],
                  ['Déficit d\'UB', `${deficit.toFixed(2)} UB`, deficit > 0 ? 'red' : 'green'],
                  null,
                  ['Coefficient selon effectif', `${coefficient} (entreprise ${effectifTotal < 250 ? '< 250' : effectifTotal < 750 ? '250–749' : '≥ 750'} sal.)`, 'info'],
                  ['SMIC horaire de référence', `${smicRef.toFixed(2)} €`],
                  null,
                ].map((row, i) => {
                  if (!row) return <div key={i} className="border-t border-[#E2E8F0] my-2" />
                  const [label, val, color] = row
                  return (
                    <div key={i} className="flex justify-between py-1.5 font-mono text-sm">
                      <span className="text-[#6B7280]">{label}</span>
                      <span className={`font-semibold ${color === 'red' ? 'text-[#B71C1C]' : color === 'green' ? 'text-[#2E7D32]' : color === 'info' ? 'text-[#1E4A8C]' : 'text-[#1A1A2E]'}`}>{val}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between py-2 border-t-2 border-[#E2E8F0]">
                  <span className="text-sm font-semibold text-[#1A1A2E]">= Contribution brute (déficit × {coefficient} × {smicRef.toFixed(2)} €)</span>
                  <span className="text-sm font-bold text-[#1A1A2E]">{formatEuros(contributionBrute)}</span>
                </div>
              </div>

              {deficit === 0 && (
                <InfoBox color="green">
                  <p className="font-semibold">Taux d&apos;emploi atteint, aucune contribution due</p>
                  <p>Votre taux BOETH de <strong>{tauxActuel.toFixed(1)}%</strong> est supérieur ou égal au quota légal de 6%. La contribution brute est nulle. Vous pouvez passer directement à l&apos;export.</p>
                </InfoBox>
              )}

              {/* Déductions */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1A1A2E]">Déductions applicables</p>

                {/* ① Déduction EA/ESAT/TIH */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">① Sous-traitance EA / ESAT / TIH</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Déduction calculée à partir de l&apos;<strong>attestation annuelle</strong> remise par chaque EA/ESAT avant le 31&nbsp;janvier&nbsp;{annee + 1}.
                      Formule légale : 30% × (prix HT − coûts matières/sous-traitance).
                    </p>
                  </div>

                  {achatsAnnee.length > 0 ? (
                    <div className="space-y-3">
                      <InfoBox color="blue">
                        <p>
                          Talenth a trouvé <strong>{achatsAnnee.length} achat{achatsAnnee.length > 1 ? 's' : ''}</strong> enregistré{achatsAnnee.length > 1 ? 's' : ''} pour {annee}.
                          Pour chaque fournisseur, saisissez le <strong>montant exact de l&apos;attestation officielle</strong> dès que vous la recevez.
                          Sans attestation, Talenth applique une <strong>estimation à 30% du HT</strong>, données sauvegardées et réutilisables.
                        </p>
                      </InfoBox>

                      {/* Table dépliable des achats */}
                      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 bg-white text-sm font-medium text-[#1A1A2E] hover:bg-[#EBF2FA] transition-colors"
                          onClick={() => setShowAchatsDetail(v => !v)}
                        >
                          <span className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-[#1E4A8C] shrink-0" />
                            Achats {annee}, {achatsAnnee.length} facture{achatsAnnee.length > 1 ? 's' : ''} · {formatEuros(totalAchatsESAT)} HT
                            {deductionParAchat.some(a => a.hasAttestation) && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {deductionParAchat.filter(a => a.hasAttestation).length}/{achatsAnnee.length} attestation{deductionParAchat.filter(a => a.hasAttestation).length > 1 ? 's' : ''} saisie{deductionParAchat.filter(a => a.hasAttestation).length > 1 ? 's' : ''}
                              </span>
                            )}
                          </span>
                          {showAchatsDetail
                            ? <ChevronUp className="w-4 h-4 text-[#6B7280] shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />
                          }
                        </button>

                        {showAchatsDetail && (
                          <div className="overflow-x-auto border-t border-[#E2E8F0]">
                            <p className="px-4 py-2 text-[11px] text-[#6B7280] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                              Saisissez le montant de l&apos;attestation officielle par fournisseur. Laissez vide pour utiliser l&apos;estimation Talenth (30% × HT). La valeur est sauvegardée automatiquement.
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-white border-b border-[#E2E8F0]">
                                  {['Fournisseur', 'Date', 'Montant HT', 'Est. 30% HT', 'Attestation officielle, optionnel', 'Déduction retenue'].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E2E8F0]">
                                {deductionParAchat.map(a => (
                                  <tr key={a.id} className="bg-white hover:bg-[#F8FAFC]">
                                    <td className="px-3 py-2.5 font-medium text-[#1A1A2E]">{a.fournisseur}</td>
                                    <td className="px-3 py-2.5 text-[#6B7280] whitespace-nowrap">
                                      {new Date(a.date_facture).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </td>
                                    <td className="px-3 py-2.5 text-[#1A1A2E] whitespace-nowrap">{formatEuros(a.montant_ht)}</td>
                                    <td className="px-3 py-2.5 text-[#6B7280] whitespace-nowrap">{formatEuros(Math.round(a.montant_ht * 0.3))}</td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <Input
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          placeholder={`${(a.montant_ht * 0.3).toFixed(0)} (est.)`}
                                          value={attestationsLocales[a.id] ?? ''}
                                          onChange={e => {
                                            const v = e.target.value
                                            setAttestationsLocales(prev => ({ ...prev, [a.id]: v === '' ? '' : Number(v) }))
                                          }}
                                          onBlur={() => saveAttestation(a.id, attestationsLocales[a.id] ?? '')}
                                          className="w-32 h-7 text-xs"
                                        />
                                        {savingAttestation === a.id
                                          ? <Loader2 className="w-3 h-3 animate-spin text-[#6B7280] shrink-0" />
                                          : a.hasAttestation
                                            ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" aria-label="Attestation enregistrée" />
                                            : <span className="w-3 shrink-0" />
                                        }
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                      <span className="font-semibold text-[#1A1A2E]">{formatEuros(a.deductionRetenue)}</span>
                                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${a.hasAttestation ? 'bg-green-100 text-green-700' : 'bg-[#EBF2FA] text-[#1E4A8C]'}`}>
                                        {a.hasAttestation ? 'attestation' : 'estimation'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-[#EBF2FA] border-t-2 border-[#1E4A8C]/20">
                                  <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-[#1A1A2E]">TOTAL</td>
                                  <td className="px-3 py-2.5 text-xs font-bold text-[#1A1A2E] whitespace-nowrap">{formatEuros(totalAchatsESAT)}</td>
                                  <td className="px-3 py-2.5 text-xs text-[#6B7280] whitespace-nowrap">{formatEuros(Math.round(totalAchatsESAT * 0.3))}</td>
                                  <td />
                                  <td className="px-3 py-2.5 text-xs font-bold text-[#1E4A8C] whitespace-nowrap">{formatEuros(deductionESAT)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Résumé déduction + plafond */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#6B7280]">Déduction EA/ESAT retenue :</span>
                          <span className="font-bold text-[#1A1A2E]">{formatEuros(deductionESAT)}</span>
                          <span className="text-[10px] text-[#6B7280]">
                            {deductionParAchat.every(a => a.hasAttestation)
                              ? '(toutes attestations saisies ✓)'
                              : deductionParAchat.some(a => a.hasAttestation)
                                ? `(${deductionParAchat.filter(a => a.hasAttestation).length} attestation${deductionParAchat.filter(a => a.hasAttestation).length > 1 ? 's' : ''} + ${deductionParAchat.filter(a => !a.hasAttestation).length} estimation${deductionParAchat.filter(a => !a.hasAttestation).length > 1 ? 's' : ''})`
                                : '(estimations Talenth à 30%)'}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B7280]">
                          Plafond : {tauxActuel >= 3 ? '75%' : '50%'} × contrib. = <strong>{formatEuros(plafondDeductionESAT)}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Aucun achat enregistré : fallback saisie manuelle */
                    <div className="space-y-3">
                      <InfoBox color="blue">
                        <p>
                          Aucun achat EA/ESAT/TIH enregistré pour {annee} dans Talenth.
                          Saisissez-les dans <strong>Achats ESAT/EA</strong> pour que l&apos;assistant les pré-remplisse
                          automatiquement ici, achat par achat, avec vos attestations.
                          Ou entrez directement le montant total ci-dessous.
                        </p>
                      </InfoBox>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Montant total de l&apos;attestation (€)</Label>
                          <Input type="number" min={0} value={deductionESATManuel} onChange={e => setDeductionESATManuel(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#6B7280]">Plafond légal</Label>
                          <div className="h-10 flex items-center text-sm text-[#6B7280]">
                            {tauxActuel >= 3 ? '75%' : '50%'} × {formatEuros(contributionBrute)} = <strong className="ml-1">{formatEuros(plafondDeductionESAT)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {deductionESAT > plafondDeductionESAT && (
                    <InfoBox color="orange">
                      Montant plafonné à <strong>{formatEuros(plafondDeductionESAT)}</strong> ({tauxActuel >= 3 ? '75' : '50'}% de la contribution brute).
                      Le plafond est de 75% si votre taux BOETH est ≥ 3%, sinon 50%.
                    </InfoBox>
                  )}
                </div>

                {/* Déduction accords */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">② Accords collectifs agréés</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Dépenses engagées au titre d&apos;un accord de branche ou d&apos;entreprise approuvé par la <strong>DREETS</strong>.
                      Ne pas renseigner si votre entreprise n&apos;est pas couverte par un accord OETH agréé.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Montant accord agréé (€)</Label>
                    <Input type="number" min={0} value={deductionAccords} onChange={e => setDeductionAccords(Number(e.target.value))} className="max-w-48" />
                  </div>
                </div>

                {/* Déduction dépenses */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">③ Autres dépenses déductibles</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Actions de formation, d&apos;adaptation au poste, de maintien dans l&apos;emploi en faveur des BOETH,
                      dans la limite de <strong>10% de la contribution brute</strong> ({formatEuros(contributionBrute * 0.1)}).
                      Vérifiez l&apos;éligibilité avec votre gestionnaire de paie.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Montant dépenses déductibles (€)</Label>
                    <Input type="number" min={0} value={deductionAutres} onChange={e => setDeductionAutres(Number(e.target.value))} className="max-w-48" />
                  </div>
                </div>
              </div>

              {/* Résultat */}
              <div className="bg-[#EBF2FA] border-2 border-[#1E4A8C]/30 rounded-xl p-5 space-y-2">
                <div className="flex justify-between text-sm text-[#6B7280]">
                  <span>Contribution brute</span><span>{formatEuros(contributionBrute)}</span>
                </div>
                {deductionESATAppliquee > 0 && <div className="flex justify-between text-sm text-[#6B7280]"><span>(-) Sous-traitance ESAT/EA</span><span>− {formatEuros(deductionESATAppliquee)}</span></div>}
                {deductionAccords > 0 && <div className="flex justify-between text-sm text-[#6B7280]"><span>(-) Accords agréés</span><span>− {formatEuros(deductionAccords)}</span></div>}
                {deductionAutres > 0 && <div className="flex justify-between text-sm text-[#6B7280]"><span>(-) Dépenses déductibles</span><span>− {formatEuros(deductionAutres)}</span></div>}
                <div className="border-t border-[#1E4A8C]/20 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1E4A8C]">CONTRIBUTION NETTE À VERSER</span>
                  <span className="text-2xl font-bold text-[#1E4A8C]">{formatEuros(contributionNette)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : Export DSN ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Récapitulatif & export pour la DSN</h2>
                <p className="text-sm text-[#6B7280] mt-1">Vérifiez les données, puis exportez le fichier pour votre gestionnaire de paie</p>
              </div>

              {/* Mode d'acquittement */}
              <div className={`rounded-xl p-4 border-2 ${modeAcquittement.color === 'green' ? 'bg-green-50 border-green-200' : modeAcquittement.color === 'blue' ? 'bg-[#EBF2FA] border-[#1E4A8C]/30' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-start gap-3">
                  <BadgeCheck className={`w-5 h-5 mt-0.5 shrink-0 ${modeAcquittement.color === 'green' ? 'text-[#2E7D32]' : modeAcquittement.color === 'blue' ? 'text-[#1E4A8C]' : 'text-orange-700'}`} />
                  <div>
                    <p className={`text-sm font-bold ${modeAcquittement.color === 'green' ? 'text-[#2E7D32]' : modeAcquittement.color === 'blue' ? 'text-[#1E4A8C]' : 'text-orange-800'}`}>
                      Mode d&apos;acquittement : {modeAcquittement.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${modeAcquittement.color === 'green' ? 'text-green-700' : modeAcquittement.color === 'blue' ? 'text-[#1E4A8C]/80' : 'text-orange-700'}`}>
                      {modeAcquittement.desc}
                    </p>
                    <p className={`text-xs mt-1 font-mono ${modeAcquittement.color === 'green' ? 'text-green-600' : modeAcquittement.color === 'blue' ? 'text-[#1E4A8C]/70' : 'text-orange-600'}`}>
                      Code DSN indicatif : {modeAcquittement.code}, à confirmer avec votre logiciel de paie
                    </p>
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="space-y-0 rounded-xl border border-[#E2E8F0] overflow-hidden">
                {[
                  ['Organisation', orgName],
                  ['Année de déclaration', String(annee)],
                  ['Effectif total', `${effectifTotal} salariés`],
                  ['Quota théorique (6%)', `${quotaTheorique.toFixed(2)} UB`],
                  ['UB BOETH comptabilisées', `${ubTotales.toFixed(2)} UB (${salariesAnnee.length} sal. + ${stagiaires} stag.)`],
                  ['Taux d\'emploi BOETH', `${tauxActuel.toFixed(2)}%`],
                  ['Déficit', `${deficit.toFixed(2)} UB`],
                  ['Contribution brute', formatEuros(contributionBrute)],
                  ['(-) Déduction EA/ESAT/TIH', `− ${formatEuros(deductionESATAppliquee)}`],
                  ['(-) Accords de branche', `− ${formatEuros(deductionAccords)}`],
                  ['(-) Dépenses déductibles', `− ${formatEuros(deductionAutres)}`],
                ].map(([k, v], i) => (
                  <div key={k} className={`flex justify-between px-4 py-2.5 text-sm border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <span className="text-[#6B7280]">{k}</span>
                    <span className="font-medium text-[#1A1A2E]">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3.5 bg-[#EBF2FA]">
                  <span className="font-bold text-[#1E4A8C]">CONTRIBUTION NETTE À VERSER</span>
                  <span className="font-bold text-[#1E4A8C] text-base">{formatEuros(contributionNette)}</span>
                </div>
              </div>

              {/* Export */}
              <Button className="w-full gap-2 h-11 text-base" onClick={exportExcel} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Exporter le dossier DOETH (.xlsx)
              </Button>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { title: 'Contenu du fichier', items: ['Récapitulatif DOETH', 'Détail par établissement', 'Liste salariés RQTH', 'Achats ESAT/EA', 'Guide de saisie DSN'] },
                  { title: 'À faire ensuite', items: [`Transmettre à votre gestionnaire de paie avant fin mars ${annee + 1}`, `Intégrer dans la DSN de paie d'avril ${annee + 1}`, `Conserver les attestations ESAT jusqu'au contrôle AGEFIPH`] },
                ].map(({ title, items }) => (
                  <div key={title} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-1.5">
                    <p className="font-semibold text-[#1A1A2E]">{title}</p>
                    {items.map(item => (
                      <p key={item} className="text-[#6B7280] flex gap-1.5"><span className="text-[#1E4A8C]">›</span>{item}</p>
                    ))}
                  </div>
                ))}
              </div>

              <Button variant="ghost" className="w-full gap-2 text-[#6B7280]" onClick={() => { setStep(0); setStagiaires(0); setDeductionESATManuel(0); setDeductionAccords(0); setDeductionAutres(0) }}>
                <RotateCcw className="w-4 h-4" />
                Recommencer une nouvelle déclaration
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
          <ChevronLeft className="w-4 h-4" />Précédent
        </Button>
        {step < ETAPES.length - 1 && (
          <Button onClick={() => setStep(s => s + 1)} className="gap-2">
            Suivant<ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
