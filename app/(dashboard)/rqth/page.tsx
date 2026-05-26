'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Users, Download, Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEstablishment } from '@/contexts/EstablishmentContext'
import { useProfile } from '@/contexts/ProfileContext'
import { toast } from 'sonner'
import { triggerExport } from '@/lib/excel/download'
import { Button } from '@/components/ui/button'
import { TableauRQTH } from '@/components/rqth/TableauRQTH'
import { FormRQTH } from '@/components/rqth/FormRQTH'
import { ImportCSV } from '@/components/rqth/ImportCSV'
import { Skeleton } from '@/components/ui/skeleton'
import type { RQTHEmployee, Profile, Establishment } from '@/types'

const PAGE_SIZE = 25

export default function RQTHPage() {
  const supabase = useMemo(() => createClient(), [])
  const { selectedEstablishmentId } = useEstablishment()
  const { profile: ctxProfile, orgId, establishmentId } = useProfile()
  const [salaries, setSalaries] = useState<RQTHEmployee[]>([])
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [profile, setProfile] = useState<Profile | null>(ctxProfile)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const loadData = useCallback(async () => {
    const resolvedOrgId = orgId ?? await (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) setProfile(p)
      return p?.organization_id ?? null
    })()
    if (!resolvedOrgId) { setLoading(false); return }

    // Requête salariés : filtrée par établissement si rôle restreint (charge_mission/lecteur)
    let salQuery = supabase
      .from('rqth_employees')
      .select('*')
      .eq('organization_id', resolvedOrgId)
      .order('created_at', { ascending: false })
    if (establishmentId) salQuery = salQuery.eq('establishment_id', establishmentId)

    const [{ data: sal }, { data: sites }] = await Promise.all([
      salQuery,
      supabase.from('establishments').select('*').eq('organization_id', resolvedOrgId),
    ])
    setSalaries(sal ?? [])
    setEtablissements(sites ?? [])
    setLoading(false)
  }, [supabase, orgId, establishmentId])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    if (!selectedEstablishmentId) return salaries
    return salaries.filter(s => s.establishment_id === selectedEstablishmentId)
  }, [salaries, selectedEstablishmentId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EBF2FA] rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">
              {filtered.length} salarié{filtered.length !== 1 ? 's' : ''} enregistré{filtered.length !== 1 ? 's' : ''}
              {selectedEstablishmentId && salaries.length !== filtered.length && (
                <span className="ml-1 text-[#1E4A8C]">(filtre actif)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"
            disabled={exporting}
            onClick={async () => {
              setExporting(true)
              try {
                await triggerExport({
                  type: 'rqth',
                  data: { orgName: '', salaries, etablissements },
                  filename: `Talenth_RQTH_${new Date().toISOString().slice(0, 10)}.xlsx`,
                })
              } catch { toast.error("Erreur lors de l'export") }
              finally { setExporting(false) }
            }}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel
          </Button>
          {profile?.role !== 'lecteur' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4" />
                Importer CSV
              </Button>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un salarié
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <TableauRQTH
          salaries={paginated}
          organizationId={profile?.organization_id ?? orgId ?? ''}
          onRefresh={loadData}
          readonly={profile?.role === 'lecteur'}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#6B7280]">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur {filtered.length} salariés
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-[#1E4A8C] text-white'
                      : 'border border-[#E2E8F0] text-[#6B7280] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {profile?.organization_id && profile.role !== 'lecteur' && (
        <>
          <FormRQTH
            open={showForm}
            onClose={() => setShowForm(false)}
            onSuccess={loadData}
            organizationId={profile.organization_id}
            defaultEstablishmentId={selectedEstablishmentId}
          />
          <ImportCSV
            open={showImport}
            onClose={() => setShowImport(false)}
            onSuccess={() => { loadData(); setCurrentPage(1) }}
            organizationId={profile.organization_id}
          />
        </>
      )}
    </div>
  )
}
