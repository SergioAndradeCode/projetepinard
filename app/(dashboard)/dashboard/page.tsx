import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JaugeOETH } from '@/components/dashboard/JaugeOETH'
import { CarteContribution } from '@/components/dashboard/CarteContribution'
import { CarteAlertes } from '@/components/dashboard/CarteAlertes'
import { CarteProjection } from '@/components/dashboard/CarteProjection'
import { BandeauStatut } from '@/components/dashboard/BandeauStatut'
import { CarteGap } from '@/components/dashboard/CarteGap'
import { CarteEtablissements } from '@/components/dashboard/CarteEtablissements'
import { CarteTypesReconnaissance } from '@/components/dashboard/CarteTypesReconnaissance'
import { CarteHistorique, type AnneeHistorique } from '@/components/dashboard/CarteHistorique'
import { CarteSimulation } from '@/components/dashboard/CarteSimulation'
import { InfoTooltip } from '@/components/dashboard/InfoTooltip'
import { calculerStats, getStatutRQTH, getCoeffAgeCourant } from '@/lib/oeth/calculs'
import { Users, AlertTriangle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatEuros } from '@/lib/utils'
import type { MoisProjection } from '@/components/dashboard/CarteProjection'
import type { Establishment, RQTHEmployee, ESATPurchase } from '@/types'

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function buildProjectionAnnee(
  annee: number,
  sal: RQTHEmployee[],
  effectif: number,
  anneeActuelle: number,
  moisActuel: number,
): MoisProjection[] {
  return MOIS.map((mois, m) => {
    const endOfMonth = new Date(annee, m + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)
    const startOfMonth = new Date(annee, m, 1)

    const actifsAuMois = sal.filter(s => {
      const debut = new Date(s.date_debut)
      if (debut > endOfMonth) return false
      if (s.est_permanent || !s.date_fin) return true
      return new Date(s.date_fin) >= startOfMonth
    })

    const ubMois = actifsAuMois.reduce((sum, s) => {
      const coeff = getCoeffAgeCourant(s.date_naissance)
      return sum + (s.taux_temps_travail ?? 100) / 100 * coeff
    }, 0)
    const tauxMois = effectif > 0 ? (ubMois / effectif) * 100 : 0

    if (annee > anneeActuelle) return { mois, taux: tauxMois, type: 'projection' }
    if (m < moisActuel) return { mois, taux: tauxMois, type: 'passe' }
    if (m === moisActuel) return { mois, taux: tauxMois, type: 'actuel' }
    return { mois, taux: tauxMois, type: 'projection' }
  })
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/onboarding')

  const orgId = profile.organization_id
  const anneeActuelle = new Date().getFullYear()
  const moisActuel = new Date().getMonth() // 0-indexed

  // Rôles restreints à un seul établissement
  const SCOPED_ROLES = ['charge_mission', 'lecteur']
  const isScoped = SCOPED_ROLES.includes(profile.role ?? '')
  const scopedEstabId = isScoped ? (profile.establishment_id ?? null) : null

  // Helper : ajoute le filtre établissement si l'utilisateur est restreint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function withEstab(q: any): any {
    return scopedEstabId ? q.eq('establishment_id', scopedEstabId) : q
  }

  const [
    { data: etablissements },
    { data: salaries },
    { data: achats },
    { data: allSettingsData },
    { data: budgetAlloc },
    { data: budgetExpenses },
  ] = await Promise.all([
    withEstab(supabase.from('establishments').select('*').eq('organization_id', orgId).order('is_headquarters', { ascending: false })),
    withEstab(supabase.from('rqth_employees').select('*').eq('organization_id', orgId)),
    withEstab(supabase.from('esat_purchases').select('*').eq('organization_id', orgId)),
    supabase.from('oeth_settings').select('*').eq('organization_id', orgId).order('annee', { ascending: true }),
    withEstab(supabase.from('budget_allocations').select('*').eq('organization_id', orgId).eq('annee', anneeActuelle)).maybeSingle(),
    withEstab(supabase.from('budget_expenses').select('montant').eq('organization_id', orgId)),
  ])

  const sites = (etablissements ?? []) as Establishment[]
  const sal = (salaries ?? []) as RQTHEmployee[]
  const ach = (achats ?? []) as ESATPurchase[]
  const allSettings = allSettingsData ?? []
  const settings = allSettings.find(s => s.annee === anneeActuelle) ?? null

  // ── Consolidation multi-sites ─────────────────────────────────────────────
  const totalBrutSites = sites.reduce((s, e) => s + (e.effectif_brut || 0), 0)
  const totalEcapSites = sites.reduce((s, e) => s + (e.effectif_ecap || 0), 0)

  const effectifBrut = totalBrutSites > 0
    ? totalBrutSites
    : (settings?.effectif_brut || settings?.effectif_assujettissement || 0)
  const effectifEcap = totalBrutSites > 0
    ? totalEcapSites
    : (settings?.effectif_ecap || 0)

  if (effectifBrut === 0 && !settings) {
    return <ConfigurerParametres />
  }

  const smicRef = settings?.smic_horaire_ref ?? 11.88

  const stats = calculerStats(sal, ach, effectifBrut, effectifEcap, smicRef)

  // ── Projection mensuelle N, N+1, N+2 ─────────────────────────────────────
  const effectif = stats.effectif

  const projectionData = buildProjectionAnnee(anneeActuelle, sal, effectif, anneeActuelle, moisActuel)
  const projectionDataN1 = buildProjectionAnnee(anneeActuelle + 1, sal, effectif, anneeActuelle, moisActuel)
  const projectionDataN2 = buildProjectionAnnee(anneeActuelle + 2, sal, effectif, anneeActuelle, moisActuel)

  const tauxFinAnnee = projectionData[11]?.taux ?? stats.taux
  const ubManquantesFin = Math.max(0, stats.quotaTheorique - (effectif > 0 ? tauxFinAnnee / 100 * effectif : 0))

  // ── Indicateurs supplémentaires ───────────────────────────────────────────
  const expirantBientot = sal.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) === 'expire_bientot').length
  const achatsAnnee = ach.filter(a => new Date(a.date_facture).getFullYear() === anneeActuelle)
  const totalAchatsESAT = achatsAnnee.reduce((s, a) => s + a.montant_ht, 0)

  // ── Historique multi-années ───────────────────────────────────────────────
  const donneesHistoriques: AnneeHistorique[] = allSettings
    .filter(s => s.annee < anneeActuelle)
    .slice(-4)
    .map(s => {
      const startOfYear = new Date(s.annee, 0, 1)
      const endOfYear   = new Date(s.annee, 11, 31)
      const salAnnee = sal.filter(emp => {
        const debut = new Date(emp.date_debut)
        if (debut > endOfYear) return false
        if (emp.est_permanent || !emp.date_fin) return true
        return new Date(emp.date_fin) >= startOfYear
      })
      const achAnnee = ach.filter(a => new Date(a.date_facture).getFullYear() === s.annee)
      const hStats = calculerStats(
        salAnnee, achAnnee,
        s.effectif_brut || s.effectif_assujettissement,
        s.effectif_ecap || 0,
        s.smic_horaire_ref ?? 11.88,
      )
      return {
        annee:    s.annee,
        taux:     hStats.taux,
        nbBoeth:  hStats.nbRQTHActifs,
        ubTotal:  hStats.ubRQTH,
        conforme: hStats.taux >= 6,
      }
    })

  const depensesTotales = (budgetExpenses ?? []).reduce((s: number, e: { montant?: number | null }) => s + (e.montant ?? 0), 0)
  const budgetTotal = budgetAlloc?.montant_total ?? 0

  // ── BOETH 50+ seniors (actifs uniquement) ────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nbSeniors = sal.filter(s => {
    const actif = s.est_permanent || !s.date_fin || new Date(s.date_fin) >= today
    return actif && getCoeffAgeCourant(s.date_naissance) === 1.5
  })

  return (
    <div className="space-y-5">

      {/* Bandeau statut pleine largeur */}
      <BandeauStatut stats={stats} annee={anneeActuelle} nbSites={sites.length} />

      {/* Ligne 1 : Jauge + Gap + Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Taux OETH {anneeActuelle}</CardTitle>
              <InfoTooltip content="Rapport entre les Unités Bénéficiaires (UB) générées par vos salariés BOETH et votre effectif d'assujettissement. L'objectif légal est 6%. Chaque salarié BOETH temps plein vaut 1 UB (1,5 si 50 ans et plus)." />
            </div>
          </CardHeader>
          <CardContent>
            <JaugeOETH stats={stats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Gap à combler</CardTitle>
              <InfoTooltip content="Nombre d'Unités Bénéficiaires manquantes pour atteindre les 6%. Correspond au nombre de recrutements BOETH équivalent temps plein nécessaires pour être en conformité." />
            </div>
          </CardHeader>
          <CardContent>
            <CarteGap stats={stats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Contribution AGEFIPH</CardTitle>
              <InfoTooltip content="Montant dû à l'AGEFIPH si le quota de 6% n'est pas atteint. Calculé sur la base : UB manquantes × SMIC horaire de référence × coefficient selon effectif (400 / 500 / 600). Déductible des achats ESAT/EA." />
            </div>
          </CardHeader>
          <CardContent>
            <CarteContribution stats={stats} />
          </CardContent>
        </Card>
      </div>

      {/* Ligne 2 : Projection + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CardTitle className="text-[15px]">Projection fin d&apos;année</CardTitle>
                <InfoTooltip content="Évolution mensuelle du taux OETH. Les barres pleines sont les données réelles (mois passés), les barres claires sont la projection basée sur vos reconnaissances actuellement actives. Les onglets N+1 / N+2 simulent la trajectoire future en supposant les reconnaissances actuelles maintenues." />
              </div>
              <span className="text-[10px] text-[#6B7280] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-full">
                Reconnaissances actives
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CarteProjection
              data={projectionData}
              dataN1={projectionDataN1}
              dataN2={projectionDataN2}
              ubManquantes={ubManquantesFin}
              annee={anneeActuelle}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CardTitle className="text-[15px]">Alertes prioritaires</CardTitle>
                <InfoTooltip content="Reconnaissances RQTH/BOETH arrivant à expiration dans les 90 prochains jours ou déjà expirées. Un salarié dont la reconnaissance expire perd ses UB à compter du mois suivant. Agissez avant expiration pour maintenir votre taux." />
              </div>
              {sal.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) !== 'actif').length > 0 && (
                <span className="w-5 h-5 bg-[#B71C1C] text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {sal.filter(s => getStatutRQTH(s.date_fin, s.est_permanent) !== 'actif').length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CarteAlertes salaries={sal} />
          </CardContent>
        </Card>
      </div>

      {/* Ligne 3 : BOETH actifs + Types reconnaissance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BOETH actifs */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Salariés BOETH</CardTitle>
              <InfoTooltip content="Bénéficiaires de l'Obligation d'Emploi des Travailleurs Handicapés. Comptent dans le quota OETH : salariés RQTH, AAH, invalidité catégorie 2 ou 3, etc. Les alternants comptent, les stagiaires et intérimaires sont exclus (réforme 2020)." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">

              {/* Chiffres principaux */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#EBF2FA] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-[32px] font-bold text-[#1A1A2E] leading-none">{stats.nbRQTHActifs}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">actifs sur {sal.length} enregistrés</p>
                  </div>
                  <div className="h-8 w-px bg-[#E2E8F0]" />
                  <div>
                    <p className="text-[22px] font-bold text-[#1E4A8C] leading-none">{stats.ubRQTH.toFixed(2)}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">UB générées</p>
                  </div>
                </div>
              </div>

              {/* Ligne détail */}
              <div className="grid grid-cols-2 gap-2">
                {/* Seniors */}
                <div className={`rounded-lg p-3 border ${nbSeniors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${nbSeniors.length > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                    50 ans et plus
                  </p>
                  <p className={`text-xl font-bold leading-none ${nbSeniors.length > 0 ? 'text-amber-700' : 'text-[#1A1A2E]'}`}>
                    {nbSeniors.length}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${nbSeniors.length > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'}`}>
                    {nbSeniors.length > 0 ? 'coefficient x1,5 UB appliqué' : 'aucun coefficient majoré'}
                  </p>
                </div>

                {/* Expirations */}
                <div className={`rounded-lg p-3 border ${expirantBientot > 0 ? 'bg-orange-50 border-orange-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${expirantBientot > 0 ? 'text-orange-600' : 'text-[#9CA3AF]'}`}>
                    Expirations à venir
                  </p>
                  <p className={`text-xl font-bold leading-none ${expirantBientot > 0 ? 'text-orange-700' : 'text-[#1A1A2E]'}`}>
                    {expirantBientot}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${expirantBientot > 0 ? 'text-orange-600' : 'text-[#9CA3AF]'}`}>
                    {expirantBientot > 0 ? 'dans les 90 prochains jours' : 'toutes reconnaissances à jour'}
                  </p>
                </div>
              </div>

              <Link href="/rqth">
                <Button variant="ghost" size="sm" className="text-[#1E4A8C] hover:text-[#1E4A8C] text-xs h-8 px-2 -ml-2">
                  Voir tous les salariés →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Types de reconnaissance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Types de reconnaissance</CardTitle>
              <InfoTooltip content="Répartition des salariés BOETH par catégorie de reconnaissance : RQTH (Reconnaissance Qualité Travailleur Handicapé), AAH (Allocation Adulte Handicapé), invalidité catégorie 2 ou 3, victimes d'accidents du travail avec incapacité permanente, etc." />
            </div>
          </CardHeader>
          <CardContent>
            <CarteTypesReconnaissance salaries={sal} />
          </CardContent>
        </Card>
      </div>

      {/* Ligne 4 : Multi-sites (si > 1 établissement) */}
      {sites.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-[15px]">Répartition par établissement</CardTitle>
              <InfoTooltip content="Vue consolidée de vos établissements assujettis. L'obligation OETH s'apprécie au niveau de l'entreprise mais chaque établissement contribue à l'effectif global. Chaque site affiche son effectif et le nombre de BOETH déclarés." />
            </div>
          </CardHeader>
          <CardContent>
            <CarteEtablissements etablissements={sites} salaries={sal} />
          </CardContent>
        </Card>
      )}

      {/* Ligne 5 : Simulation interactive */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <CardTitle className="text-[15px]">Simuler des actions</CardTitle>
            <InfoTooltip content="Outil de simulation OETH : testez l'impact de recrutements BOETH, d'achats ESAT/EA ou d'un accord agréé sur votre taux et votre contribution. Les montants ESAT sont acceptés en format francais (ex : 12 000 ou 12.000 ou 12,000)." />
          </div>
        </CardHeader>
        <CardContent>
          <CarteSimulation
            stats={{
              taux:           stats.taux,
              ubRQTH:         stats.ubRQTH,
              quotaTheorique: stats.quotaTheorique,
              contribution:   stats.contribution,
              effectif:       stats.effectif,
            }}
            smicRef={smicRef}
          />
        </CardContent>
      </Card>

      {/* Ligne 6 : ESAT + Budget (conditionnels) */}
      {(achatsAnnee.length > 0 || budgetTotal > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ESAT/EA */}
          {achatsAnnee.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <CardTitle className="text-[15px]">Achats ESAT / EA {anneeActuelle}</CardTitle>
                  <InfoTooltip content="Les achats de prestations auprès d'ESAT (Établissements et Services d'Aide par le Travail) ou d'EA (Entreprises Adaptées) permettent une déduction de la contribution AGEFIPH : 30% du montant HT, plafonnée à 50% de votre contribution brute." />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#EBF2FA] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-[#1E4A8C]" />
                    </div>
                    <div>
                      <p className="text-[26px] font-bold text-[#1A1A2E] leading-none">{formatEuros(totalAchatsESAT)}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {achatsAnnee.length} facture{achatsAnnee.length > 1 ? 's' : ''} · déduction ≈ {formatEuros(Math.round(totalAchatsESAT * 0.3))}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Total HT facturé</span>
                      <span className="font-medium text-[#1A1A2E]">{formatEuros(totalAchatsESAT)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Déduction estimée (30%)</span>
                      <span className="font-medium text-[#2E7D32]">− {formatEuros(Math.round(totalAchatsESAT * 0.3))}</span>
                    </div>
                    {achatsAnnee.some(a => a.montant_attestation != null) && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Attestations officielles saisies</span>
                        <span className="font-medium text-[#1E4A8C]">
                          {achatsAnnee.filter(a => a.montant_attestation != null).length} / {achatsAnnee.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link href="/esat" className="mt-1">
                    <Button variant="ghost" size="sm" className="text-[#1E4A8C] hover:text-[#1E4A8C] text-xs h-8 px-2">
                      Voir les achats →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget */}
          {budgetTotal > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <CardTitle className="text-[15px]">Budget Handicap {anneeActuelle}</CardTitle>
                  <InfoTooltip content="Suivi du budget dédié à la politique Handicap de votre organisation (formations, aménagements de poste, sensibilisation, etc.). Ce budget est distinct de la contribution AGEFIPH." />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs text-[#6B7280]">Consommé</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">
                        {formatEuros(depensesTotales)} / {formatEuros(budgetTotal)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${depensesTotales / budgetTotal > 0.9 ? 'bg-[#B71C1C]' : depensesTotales / budgetTotal > 0.7 ? 'bg-[#BF5A00]' : 'bg-[#1E4A8C]'}`}
                        style={{ width: `${Math.min(100, (depensesTotales / budgetTotal) * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#6B7280] mt-1 text-right">
                      {((depensesTotales / budgetTotal) * 100).toFixed(1)}% consommé
                    </p>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-[#E2E8F0]">
                    <span className="text-[#6B7280]">Restant disponible</span>
                    <span className={`font-semibold ${budgetTotal - depensesTotales < 0 ? 'text-[#B71C1C]' : 'text-[#2E7D32]'}`}>
                      {formatEuros(Math.max(0, budgetTotal - depensesTotales))}
                    </span>
                  </div>
                  <Link href="/budget">
                    <Button variant="ghost" size="sm" className="text-[#1E4A8C] hover:text-[#1E4A8C] text-xs h-8 px-2">
                      Voir le budget →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ligne 7 : Historique multi-années */}
      {donneesHistoriques.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CardTitle className="text-[15px]">Historique OETH</CardTitle>
                <InfoTooltip content="Évolution de votre taux OETH sur les années précédentes, basée sur les paramètres enregistrés (effectif, SMIC de référence) et les reconnaissances actives chaque année. Une barre verte indique la conformité (taux >= 6%)." />
              </div>
              <span className="text-[10px] text-[#6B7280] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-full">
                {donneesHistoriques.length} année{donneesHistoriques.length > 1 ? 's' : ''} de données
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CarteHistorique donnees={donneesHistoriques} />
          </CardContent>
        </Card>
      )}

    </div>
  )
}

function ConfigurerParametres() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-[#EBF2FA] rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-[#1E4A8C]" />
      </div>
      <h2 className="text-[22px] font-semibold text-[#1A1A2E] mb-2">Paramètres OETH manquants</h2>
      <p className="text-[#6B7280] mb-8 max-w-md">
        Renseignez votre effectif d&apos;assujettissement pour calculer votre taux OETH.
      </p>
      <Link href="/parametres">
        <Button>Configurer les paramètres OETH</Button>
      </Link>
    </div>
  )
}
