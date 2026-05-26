'use client'

import { useEffect, useState, useMemo } from 'react'
import { Building2, ChevronDown, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEstablishment } from '@/contexts/EstablishmentContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Establishment } from '@/types'

export function EtablissementSelector() {
  const supabase = useMemo(() => createClient(), [])
  const { selectedEstablishmentId, setSelectedEstablishmentId } = useEstablishment()
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [lockedName, setLockedName] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role, establishment_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Utilisateur rattaché à un site spécifique → verrouillage
      if (profile.establishment_id) {
        setSelectedEstablishmentId(profile.establishment_id)
        const { data: etab } = await supabase
          .from('establishments')
          .select('name')
          .eq('id', profile.establishment_id)
          .single()
        setLockedName(etab?.name ?? 'Mon site')
        return
      }

      // Admin : chargement de tous les sites
      if (profile.role !== 'admin') return

      const { data } = await supabase
        .from('establishments')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('is_headquarters', { ascending: false })
        .order('name')
      setEtablissements(data ?? [])

      // Restaurer depuis URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const site = params.get('site')
        if (site && site !== 'global') setSelectedEstablishmentId(site)
      }
    }
    load()
  }, [supabase, setSelectedEstablishmentId])

  // Utilisateur verrouillé sur un site : badge non cliquable
  if (lockedName) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E4A8C]/30 bg-[#EBF2FA] text-sm text-[#1E4A8C]">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[160px] truncate font-medium">{lockedName}</span>
      </div>
    )
  }

  // Un seul établissement ou pas admin → rien à afficher
  if (etablissements.length <= 1) return null

  const selected = etablissements.find(e => e.id === selectedEstablishmentId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1A1A2E] hover:bg-[#F8FAFC] transition-colors">
          {selectedEstablishmentId ? (
            <Building2 className="w-3.5 h-3.5 text-[#1E4A8C] shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
          )}
          <span className="max-w-[160px] truncate font-medium">
            {selected ? selected.name : 'Vue globale'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => setSelectedEstablishmentId(null)}
          className={!selectedEstablishmentId ? 'bg-[#EBF2FA] text-[#1E4A8C]' : ''}
        >
          <Globe className="w-4 h-4 mr-2 text-[#6B7280]" />
          Vue globale — Entreprise entière
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {etablissements.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onClick={() => setSelectedEstablishmentId(e.id)}
            className={selectedEstablishmentId === e.id ? 'bg-[#EBF2FA] text-[#1E4A8C]' : ''}
          >
            <Building2 className="w-4 h-4 mr-2 text-[#6B7280] shrink-0" />
            <span className="truncate">{e.name}</span>
            {e.is_headquarters && (
              <span className="ml-auto text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-1.5 py-0.5 rounded font-medium shrink-0">
                Siège
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
