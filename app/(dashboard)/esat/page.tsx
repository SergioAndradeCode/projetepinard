'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Building2, ChevronDown, ChevronUp, Info, Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEstablishment } from '@/contexts/EstablishmentContext'
import { toast } from 'sonner'
import { triggerExport } from '@/lib/excel/download'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableauESAT } from '@/components/esat/TableauESAT'
import { FormESAT } from '@/components/esat/FormESAT'
import { Skeleton } from '@/components/ui/skeleton'
import type { ESATPurchase, Profile, OETHSettings, Establishment } from '@/types'

export default function ESATPage() {
  const supabase = useMemo(() => createClient(), [])
  const { selectedEstablishmentId } = useEstablishment()
  const [achats, setAchats] = useState<ESATPurchase[]>([])
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<OETHSettings | null>(null)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    if (p?.organization_id) {
      const annee = new Date().getFullYear()
      const SCOPED_ROLES = ['charge_mission', 'lecteur']
      const isScoped = SCOPED_ROLES.includes(p.role ?? '')
      const scopedId = isScoped ? (p.establishment_id ?? null) : null

      let achatQuery = supabase
        .from('esat_purchases').select('*').eq('organization_id', p.organization_id)
        .order('date_facture', { ascending: false })
      if (scopedId) achatQuery = achatQuery.eq('establishment_id', scopedId)

      const [{ data: a }, { data: s }, { data: sites }, { data: org }] = await Promise.all([
        achatQuery,
        supabase.from('oeth_settings').select('*').eq('organization_id', p.organization_id).eq('annee', annee).single(),
        supabase.from('establishments').select('*').eq('organization_id', p.organization_id),
        supabase.from('organizations').select('name').eq('id', p.organization_id).single(),
      ])
      setAchats(a ?? [])
      setSettings(s)
      setEtablissements(sites ?? [])
      setOrgName(org?.name ?? '')
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const smicHoraire = settings?.smic_horaire_ref ?? 11.88

  const filtered = useMemo(() => {
    if (!selectedEstablishmentId) return achats
    return achats.filter(a => a.establishment_id === selectedEstablishmentId)
  }, [achats, selectedEstablishmentId])

  const totalUB = filtered.reduce((sum, a) => sum + a.montant_ht / (400 * smicHoraire), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Bloc pédagogique */}
      <div className="bg-[#EBF2FA] rounded-xl border border-[#1E4A8C]/20 overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2 text-[#1E4A8C]">
            <Info className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Comment fonctionnent les UB ESAT/EA ?</span>
          </div>
          {showInfo ? <ChevronUp className="w-4 h-4 text-[#1E4A8C]" /> : <ChevronDown className="w-4 h-4 text-[#1E4A8C]" />}
        </button>
        {showInfo && (
          <div className="px-4 pb-4 text-sm text-[#1E4A8C]/80">
            <p>
              Les achats auprès d&apos;ESAT (Établissements et Services d&apos;Aide par le Travail) et d&apos;EA (Entreprises Adaptées)
              se convertissent en unités bénéficiaires selon la formule :
            </p>
            <p className="mt-2 font-mono bg-white/50 rounded-lg px-3 py-2 text-sm text-[#1E4A8C]">
              UB = Montant HT ÷ (400 × SMIC horaire)
            </p>
            <p className="mt-2">
              Ces UB sont déduites de votre contribution AGEFIPH. SMIC de référence actuel :{' '}
              <strong>{smicHoraire.toFixed(2)} €/h</strong>.
            </p>
          </div>
        )}
      </div>

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">
              {filtered.length} achat{filtered.length !== 1 ? 's' : ''} enregistré{filtered.length !== 1 ? 's' : ''}
              {selectedEstablishmentId && achats.length !== filtered.length && (
                <span className="ml-1 text-[#1E4A8C]">(filtre actif)</span>
              )}
            </p>
          </div>
          {totalUB > 0 && (
            <Badge variant="default" className="text-sm px-3 py-1">
              {totalUB.toFixed(4)} UB générées
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"
            disabled={exporting}
            onClick={async () => {
              setExporting(true)
              try {
                await triggerExport({
                  type: 'esat',
                  data: { orgName, achats: filtered, etablissements, smicRef: smicHoraire },
                  filename: `Talenth_ESAT_${new Date().toISOString().slice(0, 10)}.xlsx`,
                })
              } catch (e) { console.error('[ESAT export]', e); toast.error("Erreur lors de l'export") }
              finally { setExporting(false) }
            }}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel
          </Button>
          {profile?.role !== 'lecteur' && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un achat
            </Button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <TableauESAT
          achats={filtered}
          organizationId={profile?.organization_id ?? ''}
          smicHoraire={smicHoraire}
          onRefresh={loadData}
          readonly={profile?.role === 'lecteur'}
        />
      </div>

      {profile?.organization_id && profile.role !== 'lecteur' && (
        <FormESAT
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={loadData}
          organizationId={profile.organization_id}
          smicHoraire={smicHoraire}
          defaultEstablishmentId={selectedEstablishmentId}
        />
      )}
    </div>
  )
}
