'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Loader2, UserPlus, UserCog, Crown, Eye,
  Building2, Pencil, Trash2, AlertCircle, MoreHorizontal, Briefcase,
  Clock, Copy, Check, Link as LinkIcon, Globe, MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Profile, UserRole, Establishment } from '@/types'
import { formatDate } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PendingMember {
  id: string
  organization_id: string
  email: string
  role: UserRole
  establishment_id: string | null
  created_at: string
}

// ── Config rôles ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  admin:          { label: 'Administrateur',           icon: <Crown className="w-3.5 h-3.5" />,     description: 'Accès complet + gestion des établissements',  color: 'bg-[#EBF2FA] text-[#1E4A8C]' },
  charge_site:    { label: 'Référent(e) Handicap',     icon: <UserCog className="w-3.5 h-3.5" />,   description: 'Périmètre national, peut ajouter des accès',   color: 'bg-green-50 text-green-700' },
  charge_mission: { label: 'Chargé(e) de Mission',     icon: <Briefcase className="w-3.5 h-3.5" />, description: 'Périmètre local / site',                       color: 'bg-purple-50 text-purple-700' },
  lecteur:        { label: 'Lecteur',                  icon: <Eye className="w-3.5 h-3.5" />,       description: 'Consultation uniquement',                     color: 'bg-[#F1F5F9] text-[#6B7280]' },
}

// ── Schémas ───────────────────────────────────────────────────────────────────
const addSchema = z.object({
  email:            z.string().email('Email invalide'),
  role:             z.enum(['charge_site', 'charge_mission', 'lecteur']),
  establishment_id: z.string().nullable().optional(),
})
type AddData = z.infer<typeof addSchema>

const editSchema = z.object({
  role:             z.enum(['admin', 'charge_site', 'charge_mission', 'lecteur']),
  establishment_id: z.string().nullable().optional(),
})
type EditData = z.infer<typeof editSchema>

// ── Composant ─────────────────────────────────────────────────────────────────
export default function EquipePage() {
  const supabase = useMemo(() => createClient(), [])

  const [membres, setMembres]               = useState<Profile[]>([])
  const [pending, setPending]               = useState<PendingMember[]>([])
  const [etablissements, setEtablissements] = useState<Establishment[]>([])
  const [loading, setLoading]               = useState(true)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [copied, setCopied]                 = useState(false)

  // Modals
  const [showAdd, setShowAdd]           = useState(false)
  const [adding, setAdding]             = useState(false)
  const [editMember, setEditMember]     = useState<Profile | null>(null)
  const [saving, setSaving]             = useState(false)
  const [deleteMember, setDeleteMember] = useState<Profile | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null)
  const [deletingPending, setDeletingPending] = useState(false)

  // ── Formulaires ─────────────────────────────────────────────────────────────
  const addForm = useForm<AddData>({
    resolver: zodResolver(addSchema),
    defaultValues: { role: 'charge_mission', establishment_id: null },
  })
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) })

  const selectedAddRole = addForm.watch('role')

  const isAdmin         = currentProfile?.role === 'admin'
  const isChargeSite    = currentProfile?.role === 'charge_site'
  const isLecteur       = currentProfile?.role === 'lecteur'

  // "L'équipe MH" → tous les membres (vue informative, pas filtrée)
  // "Membres de l'équipe" → scope utilisateur : local voit seulement son site
  const membresGestion = useMemo(() => {
    const estabId = currentProfile?.establishment_id
    if (!estabId || isAdmin || isChargeSite) return membres
    // charge_mission / lecteur → uniquement les membres de leur établissement
    return membres.filter(m => m.establishment_id === estabId)
  }, [membres, currentProfile, isAdmin, isChargeSite])

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join`
    : '/join'

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setCurrentProfile(profile)

    if (profile?.organization_id) {
      // Tout le monde voit l'équipe complète (sans filtre établissement)
      // Les actions de gestion restent réservées aux admin / charge_site
      const [{ data: members }, { data: sites }, { data: pendingData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at'),
        supabase.from('establishments').select('*').eq('organization_id', profile.organization_id)
          .order('is_headquarters', { ascending: false }).order('name'),
        supabase.from('pending_members').select('*').eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false }),
      ])
      setMembres(members ?? [])
      setEtablissements(sites ?? [])
      setPending((pendingData as PendingMember[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const getEtablissementName = (id: string | null) =>
    id ? (etablissements.find(e => e.id === id)?.name ?? null) : null

  // ── Copier le lien d'inscription ─────────────────────────────────────────
  const copyJoinLink = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  // Ajoute un accès en attente dans pending_members
  const handleAdd = async (data: AddData) => {
    setAdding(true)
    const { error } = await supabase.from('pending_members').insert({
      organization_id:  currentProfile!.organization_id,
      email:            data.email.toLowerCase().trim(),
      role:             data.role,
      establishment_id: data.establishment_id ?? null,
      created_by:       currentProfile!.id,
    })

    if (error) {
      if (error.code === '23505') {
        toast.error("Cette adresse email est déjà en attente d'inscription ou déjà membre.")
      } else {
        toast.error("Erreur lors de l'ajout de l'accès")
        console.error(error)
      }
    } else {
      toast.success(`Accès ajouté pour ${data.email}`)
      setShowAdd(false)
      addForm.reset()
      await loadData()
    }
    setAdding(false)
  }

  const openEdit = (member: Profile) => {
    editForm.reset({ role: member.role, establishment_id: member.establishment_id ?? null })
    setEditMember(member)
  }

  const handleEdit = async (data: EditData) => {
    if (!editMember) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: data.role, establishment_id: data.establishment_id ?? null })
      .eq('id', editMember.id)

    if (error) {
      toast.error('Erreur lors de la modification')
    } else {
      toast.success('Membre mis à jour')
      setEditMember(null)
      await loadData()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteMember) return
    setDeleting(true)
    const { error } = await supabase
      .from('profiles')
      .update({ organization_id: null, establishment_id: null })
      .eq('id', deleteMember.id)

    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success(`${deleteMember.full_name ?? deleteMember.id} retiré de l'équipe`)
      setDeleteMember(null)
      await loadData()
    }
    setDeleting(false)
  }

  const handleDeletePending = async () => {
    if (!deletePendingId) return
    setDeletingPending(true)
    const { error } = await supabase.from('pending_members').delete().eq('id', deletePendingId)
    if (error) {
      toast.error("Erreur lors de la suppression de l'accès")
    } else {
      toast.success('Accès supprimé')
      setPending(prev => prev.filter(p => p.id !== deletePendingId))
    }
    setDeletePendingId(null)
    setDeletingPending(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }



  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Barre d'actions, admin uniquement ──────────────────────────────── */}
      {isAdmin && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Lien d'inscription à partager */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm">
            <LinkIcon className="w-4 h-4 text-[#1E4A8C] shrink-0" />
            <span className="text-[#6B7280] text-xs hidden sm:inline">Lien d&apos;inscription :</span>
            <code className="text-xs font-mono text-[#1A1A2E]">{joinUrl}</code>
            <button
              onClick={copyJoinLink}
              className="ml-1 p-1 rounded hover:bg-[#EBF2FA] transition-colors text-[#6B7280] hover:text-[#1E4A8C]"
              title="Copier le lien"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Ajouter un accès
          </Button>
        </div>
      )}

      {/* ── Compteurs par rôle ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => (
          <div key={role} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#1E4A8C]">{config.icon}</span>
              <span className="text-sm font-semibold text-[#1A1A2E] truncate">{config.label}</span>
            </div>
            <p className="text-xs text-[#6B7280] line-clamp-2">{config.description}</p>
            <p className="text-lg font-bold text-[#1E4A8C] mt-2">
              {membres.filter(m => m.role === role).length}
            </p>
          </div>
        ))}
      </div>

      {/* ── Info multi-sites ─────────────────────────────────────────────────── */}
      {etablissements.length > 1 && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Plusieurs établissements détectés. Un membre sans site rattaché accède à <strong>tous les sites</strong>.
            Un membre rattaché à un site ne voit que les données de ce site.
          </span>
        </div>
      )}

      {/* ── L'équipe MH, tous les membres actifs, visibles par tous ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#1A1A2E]">L&apos;équipe MH</h2>
          <span className="text-xs text-[#6B7280]">{membres.length} membre{membres.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Helper : carte membre active */}
        {/* Périmètre national, membres sans établissement */}
        {(() => {
          const nationaux = membres.filter(m => !m.establishment_id)
          const pendingNationaux = isAdmin ? pending.filter(p => !p.establishment_id) : []
          const total = nationaux.length + pendingNationaux.length
          return (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-[#1E4A8C]" />
                <span className="text-xs font-semibold text-[#1E4A8C] uppercase tracking-wide">Périmètre national</span>
                <span className="text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-2 py-0.5 rounded-full font-medium">{total}</span>
              </div>
              {total === 0 ? (
                <p className="text-xs text-[#9CA3AF] pl-6">Aucun</p>
              ) : (
                <div className="flex flex-wrap gap-2 pl-6">
                  {nationaux.map(m => {
                    const cfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.lecteur
                    const initials = m.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                    return (
                      <div key={m.id} className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-[#EBF2FA] flex items-center justify-center shrink-0">
                          <span className="text-[#1E4A8C] text-[10px] font-bold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1A1A2E] truncate">
                            {m.full_name ?? '-'}{m.id === currentProfile?.id && <span className="text-[#6B7280] ml-1">(vous)</span>}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium mt-0.5 ${cfg.color}`}>
                            {cfg.icon}<span>{cfg.label}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {/* En attente, admin uniquement */}
                  {pendingNationaux.map(p => {
                    const cfg = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.lecteur
                    return (
                      <div key={p.id} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1A1A2E] truncate">{p.email}</p>
                          <span className="text-[10px] text-orange-600 font-medium">En attente · </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium ${cfg.color}`}>
                            {cfg.icon}<span>{cfg.label}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Par établissement */}
        {etablissements.map(site => {
          const membresIci  = membres.filter(m => m.establishment_id === site.id)
          const pendingIci  = isAdmin ? pending.filter(p => p.establishment_id === site.id) : []
          const total = membresIci.length + pendingIci.length
          return (
            <div key={site.id} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#6B7280]" />
                <span className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide">{site.name}</span>
                {site.is_headquarters && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">Siège</span>
                )}
                <span className="text-[10px] bg-[#F1F5F9] text-[#6B7280] px-2 py-0.5 rounded-full font-medium">{total}</span>
              </div>
              {total === 0 ? (
                <p className="text-xs text-[#9CA3AF] pl-6">Aucun membre rattaché</p>
              ) : (
                <div className="flex flex-wrap gap-2 pl-6">
                  {membresIci.map(m => {
                    const cfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.lecteur
                    const initials = m.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                    return (
                      <div key={m.id} className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-[#EBF2FA] flex items-center justify-center shrink-0">
                          <span className="text-[#1E4A8C] text-[10px] font-bold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1A1A2E] truncate">
                            {m.full_name ?? '-'}{m.id === currentProfile?.id && <span className="text-[#6B7280] ml-1">(vous)</span>}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium mt-0.5 ${cfg.color}`}>
                            {cfg.icon}<span>{cfg.label}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {/* En attente, admin uniquement */}
                  {pendingIci.map(p => {
                    const cfg = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.lecteur
                    return (
                      <div key={p.id} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1A1A2E] truncate">{p.email}</p>
                          <span className="text-[10px] text-orange-600 font-medium">En attente · </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium ${cfg.color}`}>
                            {cfg.icon}<span>{cfg.label}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Membres de l'équipe, tableau de gestion (scope utilisateur) ──────── */}
      {isLecteur ? null : <Card>
        <CardHeader>
          <CardTitle>Membres de l&apos;équipe</CardTitle>
          <CardDescription>
            {membresGestion.length} membre{membresGestion.length !== 1 ? 's' : ''} actif{membresGestion.length !== 1 ? 's' : ''}
            {membresGestion.length < membres.length && (
              <span className="ml-1 text-[#1E4A8C]">votre site</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Membre</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Rôle</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Site</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Depuis</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {membresGestion.map((membre) => {
                  const config   = ROLE_CONFIG[membre.role] ?? ROLE_CONFIG.lecteur
                  const initials = membre.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                  const isMe     = membre.id === currentProfile?.id
                  const siteName = getEtablissementName(membre.establishment_id)

                  return (
                    <tr key={membre.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EBF2FA] flex items-center justify-center shrink-0">
                            <span className="text-[#1E4A8C] text-xs font-semibold">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A2E]">
                              {membre.full_name ?? '-'}
                              {isMe && <span className="ml-2 text-xs text-[#6B7280]">(vous)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-medium ${config.color}`}>
                          {config.icon}{config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {siteName ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#1E4A8C] bg-[#EBF2FA] rounded-full px-2.5 py-1 font-medium">
                            <Building2 className="w-3 h-3 shrink-0" />{siteName}
                          </span>
                        ) : (
                          <span className="text-xs text-[#6B7280]">Tous les sites</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B7280]">{formatDate(membre.created_at)}</td>
                      <td className="px-6 py-4">
                        {!isMe && isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(membre)}>
                                <Pencil className="w-3.5 h-3.5 mr-2" />Modifier le rôle / site
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteMember(membre)}
                                className="text-[#B71C1C] focus:text-[#B71C1C]"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />Retirer de l&apos;équipe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>}

      {/* ── Accès en attente d'inscription (caché aux lecteurs) ──────────────── */}
      {/* Tableau "En attente", admin uniquement, pour gérer les invitations */}
      {isAdmin && pending.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <CardTitle>Accès en attente d&apos;inscription</CardTitle>
            </div>
            <CardDescription>
              {pending.length} invitation{pending.length !== 1 ? 's' : ''} envoyée{pending.length !== 1 ? 's' : ''}, le collaborateur doit créer son compte sur{' '}
              <span className="font-medium text-[#1A1A2E]">{joinUrl}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Rôle</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Site</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Ajouté le</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {pending.map((p) => {
                    const config   = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.lecteur
                    const siteName = getEtablissementName(p.establishment_id)
                    return (
                      <tr key={p.id} className="bg-white hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-orange-500" />
                            </div>
                            <p className="text-sm font-medium text-[#1A1A2E]">{p.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-medium ${config.color}`}>
                            {config.icon}{config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {siteName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#1E4A8C] bg-[#EBF2FA] rounded-full px-2.5 py-1 font-medium">
                              <Building2 className="w-3 h-3 shrink-0" />{siteName}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6B7280]">National</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">{formatDate(p.created_at)}</td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 hover:text-[#B71C1C] hover:bg-red-50"
                            onClick={() => setDeletePendingId(p.id)}
                            title="Annuler cet accès"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modal, Ajouter un accès ─────────────────────────────────────────── */}
      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); addForm.reset() } }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Ajouter un accès</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280] -mt-1">
            L&apos;adresse email sera autorisée à créer un compte sur{' '}
            <span className="font-medium text-[#1A1A2E]">{joinUrl}</span>.
            Transmettez ce lien au collaborateur.
          </p>

          {isChargeSite && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                En tant que référent handicap, vous pouvez autoriser des <strong>chargé(e)s de mission</strong> ou des <strong>lecteurs</strong>.
              </span>
            </div>
          )}

          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Email professionnel</Label>
              <Input type="email" placeholder="collegue@entreprise.fr" {...addForm.register('email')} />
              {addForm.formState.errors.email && (
                <p className="text-xs text-[#B71C1C]">{addForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select
                defaultValue="charge_mission"
                onValueChange={v => {
                  addForm.setValue('role', v as AddData['role'])
                  addForm.setValue('establishment_id', null)
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <SelectItem value="charge_site">Référent(e) Handicap, périmètre national</SelectItem>
                  )}
                  <SelectItem value="charge_mission">Chargé(e) de Mission Handicap, périmètre local</SelectItem>
                  <SelectItem value="lecteur">Lecteur, consultation uniquement</SelectItem>
                </SelectContent>
              </Select>
              {selectedAddRole === 'charge_mission' && (
                <p className="text-xs text-[#6B7280]">
                  Le chargé de mission a un rôle technique local et ne peut pas ajouter d&apos;autres accès.
                </p>
              )}
            </div>

            {/* Site rattaché */}
            {isChargeSite ? (
              <div className="space-y-1.5">
                <Label>Site rattaché</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <Building2 className="w-4 h-4 text-[#1E4A8C]" />
                  <span className="text-sm text-[#1A1A2E] font-medium">
                    {getEtablissementName(currentProfile?.establishment_id ?? null) ?? 'Votre site'}
                  </span>
                </div>
              </div>
            ) : etablissements.length > 0 && (
              <div className="space-y-1.5">
                <Label>Site rattaché <span className="ml-1 text-[#6B7280] font-normal text-xs">(optionnel)</span></Label>
                <Select
                  defaultValue="__all__"
                  onValueChange={v => addForm.setValue('establishment_id', v === '__all__' ? null : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Accès à tous les sites</SelectItem>
                    {etablissements.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.is_headquarters ? ', Siège' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1"
                onClick={() => { setShowAdd(false); addForm.reset() }}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={adding}>
                {adding && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Autoriser l&apos;accès
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal édition membre ─────────────────────────────────────────────── */}
      <Dialog open={!!editMember} onOpenChange={v => { if (!v) setEditMember(null) }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Modifier {editMember?.full_name ?? 'le membre'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select
                value={editForm.watch('role')}
                onValueChange={v => editForm.setValue('role', v as UserRole)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="charge_site">Référent(e) Handicap, national</SelectItem>
                  <SelectItem value="charge_mission">Chargé(e) de Mission Handicap, local</SelectItem>
                  <SelectItem value="lecteur">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {etablissements.length > 0 && (
              <div className="space-y-1.5">
                <Label>Site rattaché</Label>
                <Select
                  value={editForm.watch('establishment_id') ?? '__all__'}
                  onValueChange={v => editForm.setValue('establishment_id', v === '__all__' ? null : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous les sites</SelectItem>
                    {etablissements.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.is_headquarters ? ', Siège' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditMember(null)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal suppression membre ─────────────────────────────────────────── */}
      <Dialog open={!!deleteMember} onOpenChange={v => { if (!v) setDeleteMember(null) }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Retirer ce membre ?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6B7280]">
            <span className="font-medium text-[#1A1A2E]">{deleteMember?.full_name ?? 'Ce membre'}</span> sera
            retiré de l&apos;organisation et perdra l&apos;accès à Talenth immédiatement.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteMember(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Retirer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal suppression accès en attente ──────────────────────────────── */}
      <Dialog open={!!deletePendingId} onOpenChange={v => { if (!v) setDeletePendingId(null) }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Annuler cet accès ?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6B7280]">
            L&apos;adresse email sera retirée de la liste. Le collaborateur ne pourra plus créer de compte
            avec cette adresse.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletePendingId(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeletePending} disabled={deletingPending}>
              {deletingPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
