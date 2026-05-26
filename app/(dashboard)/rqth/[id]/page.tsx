'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Pencil, Trash2, Plus, Loader2, Heart,
  FileText, Upload, Download, FolderOpen, AlertCircle,
  UserCheck, Calendar, Briefcase, Building2, Clock,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { BadgeStatut } from '@/components/rqth/BadgeStatut'
import { FormRQTH } from '@/components/rqth/FormRQTH'
import { FormMaintien } from '@/components/maintien/FormMaintien'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import { getStatutRQTH } from '@/lib/oeth/calculs'
import type { RQTHEmployee, MaintienEmploi, RQTHDocument, TypeDocument } from '@/types'
import {
  LABEL_RECONNAISSANCE, LABEL_TYPE_SITUATION, LABEL_STATUT_MAINTIEN,
  LABEL_TYPE_DOCUMENT, AMENAGEMENTS_OPTIONS,
} from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = [
  'application/pdf', 'image/png', 'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const TYPE_DOC_COLORS: Record<TypeDocument, string> = {
  rqth:            'bg-blue-50 text-blue-700 border-blue-200',
  facture:         'bg-green-50 text-green-700 border-green-200',
  maintien_emploi: 'bg-purple-50 text-purple-700 border-purple-200',
  autre:           'bg-gray-50 text-gray-600 border-gray-200',
}

const STATUT_MAINTIEN_COLORS: Record<string, string> = {
  en_cours: 'bg-blue-50 text-blue-700 border-blue-200',
  amenage:  'bg-amber-50 text-amber-700 border-amber-200',
  reclasse: 'bg-purple-50 text-purple-700 border-purple-200',
  resolu:   'bg-green-50 text-green-700 border-green-200',
  rupture:  'bg-red-50 text-red-700 border-red-200',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilRQTHPage() {
  const params = useParams()
  const router = useRouter()
  const { orgId, profile, establishmentId } = useProfile()
  const id = params.id as string
  const supabase = useMemo(() => createClient(), [])

  const isReadonly = profile?.role === 'lecteur'

  // ── State principal ──────────────────────────────────────────────────────
  const [employee, setEmployee]     = useState<RQTHEmployee | null>(null)
  const [situations, setSituations] = useState<MaintienEmploi[]>([])
  const [documents, setDocuments]   = useState<RQTHDocument[]>([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  // ── Modals ───────────────────────────────────────────────────────────────
  const [editEmployeeOpen, setEditEmployeeOpen]       = useState(false)
  const [deleteEmployeeOpen, setDeleteEmployeeOpen]   = useState(false)
  const [deletingEmployee, setDeletingEmployee]       = useState(false)
  const [formMaintienOpen, setFormMaintienOpen]       = useState(false)
  const [editSituation, setEditSituation]             = useState<MaintienEmploi | null>(null)
  const [deleteSituationId, setDeleteSituationId]     = useState<string | null>(null)
  const [deletingSituation, setDeletingSituation]     = useState(false)
  const [deleteDocId, setDeleteDocId]                 = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc]                 = useState(false)

  // ── Documents ─────────────────────────────────────────────────────────────
  const [uploading, setUploading]   = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [typeUpload, setTypeUpload] = useState<TypeDocument>('rqth')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Chargement ───────────────────────────────────────────────────────────
  const loadEmployee = useCallback(async () => {
    const { data, error } = await supabase
      .from('rqth_employees')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) { setNotFound(true); return }
    // Sécurité : un rôle restreint ne doit pas accéder à un salarié d'un autre établissement
    if (establishmentId && data.establishment_id !== establishmentId) {
      setNotFound(true)
      return
    }
    setEmployee(data as RQTHEmployee)
  }, [id, supabase, establishmentId])

  const loadSituations = useCallback(async () => {
    const { data } = await supabase
      .from('maintien_emploi')
      .select('*')
      .eq('rqth_employee_id', id)
      .order('date_debut_situation', { ascending: false })
    setSituations((data as MaintienEmploi[]) ?? [])
  }, [id, supabase])

  const loadDocuments = useCallback(async () => {
    const { data } = await supabase
      .from('rqth_documents')
      .select('*')
      .eq('rqth_employee_id', id)
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
  }, [id, supabase])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([loadEmployee(), loadSituations(), loadDocuments()])
      .finally(() => setLoading(false))
  }, [id, loadEmployee, loadSituations, loadDocuments])

  // ── Suppression salarié ───────────────────────────────────────────────────
  const handleDeleteEmployee = async () => {
    setDeletingEmployee(true)
    const { error } = await supabase.from('rqth_employees').delete().eq('id', id)
    if (error) {
      toast.error('Erreur lors de la suppression')
      setDeletingEmployee(false)
      return
    }
    toast.success('Salarié supprimé')
    router.replace('/rqth')
  }

  // ── Suppression situation ─────────────────────────────────────────────────
  const handleDeleteSituation = async () => {
    if (!deleteSituationId) return
    setDeletingSituation(true)
    const { error } = await supabase.from('maintien_emploi').delete().eq('id', deleteSituationId)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Situation supprimée')
      await loadSituations()
    }
    setDeleteSituationId(null)
    setDeletingSituation(false)
  }

  // ── Upload document ───────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    if (!orgId || !employee) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Acceptés : PDF, image, Word')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Fichier trop lourd (max ${MAX_SIZE_MB} Mo)`)
      return
    }
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const storagePath = `${orgId}/${id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('rqth-documents')
        .upload(storagePath, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('rqth_documents').insert({
        rqth_employee_id: id,
        organization_id: orgId,
        nom_fichier: file.name,
        type_document: typeUpload,
        storage_path: storagePath,
        taille: file.size,
        uploaded_by: user?.id ?? null,
      })
      if (dbError) {
        await supabase.storage.from('rqth-documents').remove([storagePath])
        throw dbError
      }
      toast.success('Document ajouté')
      await loadDocuments()
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }, [orgId, id, employee, supabase, typeUpload, loadDocuments])

  const handleDownload = async (doc: RQTHDocument) => {
    const { data, error } = await supabase.storage
      .from('rqth-documents')
      .createSignedUrl(doc.storage_path, 60)
    if (error || !data?.signedUrl) {
      toast.error('Impossible de télécharger le fichier')
      return
    }
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = doc.nom_fichier
    a.click()
  }

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return
    setDeletingDoc(true)
    const doc = documents.find(d => d.id === deleteDocId)
    if (doc) {
      await supabase.storage.from('rqth-documents').remove([doc.storage_path])
    }
    const { error } = await supabase.from('rqth_documents').delete().eq('id', deleteDocId)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Document supprimé')
      await loadDocuments()
    }
    setDeleteDocId(null)
    setDeletingDoc(false)
  }

  // ── Rendu états intermédiaires ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E4A8C]" />
      </div>
    )
  }

  if (notFound || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <AlertCircle className="w-12 h-12 text-[#CBD5E1]" />
        <p className="text-lg font-semibold text-[#1A1A2E]">Salarié introuvable</p>
        <p className="text-sm text-[#6B7280]">Ce profil n&apos;existe pas ou a été supprimé.</p>
        <Button variant="secondary" onClick={() => router.push('/rqth')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const statut = getStatutRQTH(employee.date_fin, employee.est_permanent)

  // Calcul UB
  let age = 0
  if (employee.date_naissance) {
    const naissance = new Date(employee.date_naissance)
    const today = new Date()
    age = today.getFullYear() - naissance.getFullYear()
    const pastBirthday = today.getMonth() > naissance.getMonth() ||
      (today.getMonth() === naissance.getMonth() && today.getDate() >= naissance.getDate())
    if (!pastBirthday) age--
  }
  const coeffAge = age >= 50 ? 1.5 : 1
  const ubTotal = (employee.taux_temps_travail / 100) * coeffAge

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Fil d'Ariane + actions ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push('/rqth')}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1E4A8C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        {!isReadonly && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditEmployeeOpen(true)} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setDeleteEmployeeOpen(true)}
              className="gap-1.5 border-red-200 text-[#B71C1C] hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      {/* ── En-tête salarié ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#EBF2FA] flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-[#1E4A8C]">
              {employee.prenom[0]}{employee.nom[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#1A1A2E]">
                {employee.prenom} {employee.nom}
              </h1>
              <BadgeStatut dateFin={employee.date_fin} estPermanent={employee.est_permanent} />
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              {LABEL_RECONNAISSANCE[employee.type_reconnaissance]}
            </p>
            {employee.matricule && (
              <p className="text-xs text-[#9CA3AF] mt-0.5">Matricule #{employee.matricule}</p>
            )}
          </div>
          {/* UB badge */}
          <div className="shrink-0 text-right">
            <div className={cn(
              'inline-flex flex-col items-center px-4 py-2.5 rounded-xl border',
              statut === 'actif' ? 'bg-[#EBF2FA] border-[#1E4A8C]/20' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            )}>
              <span className={cn(
                'text-2xl font-bold',
                statut === 'actif' ? 'text-[#1E4A8C]' : 'text-[#9CA3AF]'
              )}>
                {ubTotal.toFixed(2)}
              </span>
              <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">UB</span>
            </div>
            {coeffAge === 1.5 && (
              <p className="text-[10px] text-amber-600 font-medium mt-1">× 1,5 senior</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Grille Infos + Documents ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Informations RQTH ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Informations RQTH</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Dates */}
            <div className="space-y-1">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />Date de début
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">{formatDate(employee.date_debut)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />Date de fin
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">
                {employee.est_permanent
                  ? <span className="text-[#2E7D32]">Permanente</span>
                  : employee.date_fin ? formatDate(employee.date_fin) : '—'
                }
              </p>
            </div>

            {/* Taux temps travail */}
            <div className="space-y-1">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                <Clock className="w-3 h-3" />Taux temps travail
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">{employee.taux_temps_travail}%</p>
            </div>

            {/* Date naissance / Age */}
            {employee.date_naissance && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3" />Date de naissance
                </p>
                <p className="text-sm font-medium text-[#1A1A2E]">
                  {formatDate(employee.date_naissance)}
                  <span className="text-[#6B7280] font-normal ml-1.5">({age} ans)</span>
                </p>
              </div>
            )}

            {/* Poste */}
            {employee.poste && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />Poste
                </p>
                <p className="text-sm font-medium text-[#1A1A2E]">{employee.poste}</p>
              </div>
            )}

            {/* Service */}
            {employee.service && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />Service
                </p>
                <p className="text-sm font-medium text-[#1A1A2E]">{employee.service}</p>
              </div>
            )}

            {/* Bâtiment */}
            {employee.batiment && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium">Bâtiment</p>
                <p className="text-sm font-medium text-[#1A1A2E]">{employee.batiment}</p>
              </div>
            )}
          </div>

          {employee.notes && (
            <div className="pt-3 border-t border-[#F1F5F9]">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium mb-1.5">Notes</p>
              <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </div>

        {/* ── Documents ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              Documents
              {documents.length > 0 && (
                <span className="bg-[#EBF2FA] text-[#1E4A8C] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {documents.length}
                </span>
              )}
            </p>
          </div>

          {/* Zone upload */}
          {!isReadonly && (
            <div className="space-y-2">
              <Select value={typeUpload} onValueChange={(v) => setTypeUpload(v as TypeDocument)}>
                <SelectTrigger className="w-full text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LABEL_TYPE_DOCUMENT) as [TypeDocument, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center gap-1.5 cursor-pointer transition-all',
                  isDragging ? 'border-[#1E4A8C] bg-[#EBF2FA]' : 'border-[#E2E8F0] hover:border-[#1E4A8C]/40 hover:bg-[#F8FAFC]',
                  uploading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {uploading
                  ? <Loader2 className="w-5 h-5 text-[#1E4A8C] animate-spin" />
                  : <Upload className="w-5 h-5 text-[#6B7280]" />
                }
                <p className="text-xs text-[#6B7280] text-center">
                  {uploading
                    ? 'Upload en cours…'
                    : <><span className="font-medium text-[#1E4A8C]">Cliquez</span> ou déposez un fichier</>
                  }
                </p>
                <p className="text-[10px] text-[#CBD5E1]">PDF, image, Word — max {MAX_SIZE_MB} Mo</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
              />
            </div>
          )}

          {/* Liste */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-7 h-7 text-[#CBD5E1] mb-2" />
                <p className="text-sm text-[#6B7280]">Aucun document</p>
                {!isReadonly && (
                  <p className="text-xs text-[#CBD5E1] mt-0.5">Ajoutez la décision RQTH ou d&apos;autres fichiers</p>
                )}
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="w-7 h-7 bg-[#EBF2FA] rounded-md flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-[#1E4A8C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A2E] truncate">{doc.nom_fichier}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded border', TYPE_DOC_COLORS[doc.type_document])}>
                        {LABEL_TYPE_DOCUMENT[doc.type_document]}
                      </span>
                      {doc.taille && (
                        <span className="text-[10px] text-[#CBD5E1]">{formatBytes(doc.taille)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6B7280] hover:text-[#1E4A8C]"
                      onClick={() => handleDownload(doc)} title="Télécharger">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    {!isReadonly && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6B7280] hover:text-[#B71C1C] hover:bg-red-50"
                        onClick={() => setDeleteDocId(doc.id)} title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Maintien dans l'emploi ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E]">Maintien dans l&apos;emploi</p>
              <p className="text-xs text-[#6B7280]">
                {situations.length === 0
                  ? 'Aucune situation enregistrée'
                  : `${situations.length} situation${situations.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          {!isReadonly && (
            <Button
              size="sm"
              onClick={() => { setEditSituation(null); setFormMaintienOpen(true) }}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une situation
            </Button>
          )}
        </div>

        {situations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-[#E2E8F0] rounded-xl">
            <Heart className="w-8 h-8 text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#6B7280]">Pas encore de suivi de maintien</p>
            {!isReadonly && (
              <p className="text-xs text-[#9CA3AF] mt-1">
                Cliquez sur « Ajouter une situation » pour commencer le suivi
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {situations.map((sit) => (
              <SituationCard
                key={sit.id}
                situation={sit}
                readonly={isReadonly}
                onEdit={() => { setEditSituation(sit); setFormMaintienOpen(true) }}
                onDelete={() => setDeleteSituationId(sit.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Édition salarié */}
      <FormRQTH
        open={editEmployeeOpen}
        onClose={() => setEditEmployeeOpen(false)}
        onSuccess={() => { loadEmployee(); setEditEmployeeOpen(false) }}
        organizationId={orgId ?? ''}
        employee={employee}
      />

      {/* Suppression salarié */}
      <Dialog open={deleteEmployeeOpen} onOpenChange={(v) => !v && setDeleteEmployeeOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce salarié ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            La reconnaissance de <strong>{employee.prenom} {employee.nom}</strong> et tous ses documents seront supprimés. Cette action est irréversible.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteEmployeeOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteEmployee} disabled={deletingEmployee}>
              {deletingEmployee && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire situation */}
      <FormMaintien
        open={formMaintienOpen}
        onClose={() => { setFormMaintienOpen(false); setEditSituation(null) }}
        onSuccess={() => { loadSituations(); setFormMaintienOpen(false); setEditSituation(null) }}
        organizationId={orgId ?? ''}
        situation={editSituation}
        preselectedEmployee={employee}
        rqthEmployeeId={id}
        establishmentId={establishmentId}
      />

      {/* Suppression situation */}
      <Dialog open={!!deleteSituationId} onOpenChange={(v) => !v && setDeleteSituationId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette situation ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Cette action est irréversible. Le suivi de maintien sera définitivement supprimé.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteSituationId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteSituation} disabled={deletingSituation}>
              {deletingSituation && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suppression document */}
      <Dialog open={!!deleteDocId} onOpenChange={(v) => !v && setDeleteDocId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce document ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Le fichier sera définitivement supprimé. Cette action est irréversible.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteDocId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteDoc} disabled={deletingDoc}>
              {deletingDoc && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ── Sous-composant : carte situation maintien ─────────────────────────────────

interface SituationCardProps {
  situation: MaintienEmploi
  readonly: boolean
  onEdit: () => void
  onDelete: () => void
}

function SituationCard({ situation: sit, readonly, onEdit, onDelete }: SituationCardProps) {
  const amenagementLabels = sit.amenagements
    ?.map(v => AMENAGEMENTS_OPTIONS.find(o => o.value === v)?.label ?? v)
    ?? []

  return (
    <div className="rounded-xl border border-[#E2E8F0] p-4 space-y-3 hover:border-[#CBD5E1] transition-colors">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={cn(
            'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border',
            STATUT_MAINTIEN_COLORS[sit.statut]
          )}>
            {LABEL_STATUT_MAINTIEN[sit.statut]}
          </span>
          <p className="text-sm font-semibold text-[#1A1A2E] mt-1.5">
            {LABEL_TYPE_SITUATION[sit.type_situation]}
          </p>
        </div>
        {!readonly && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6B7280] hover:text-[#1E4A8C]" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6B7280] hover:text-[#B71C1C] hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Depuis le {formatDate(sit.date_debut_situation)}
        </span>
        {sit.date_retour_prevue && (
          <span className="text-[#6B7280]">→ retour le {formatDate(sit.date_retour_prevue)}</span>
        )}
      </div>

      {/* Aménagements */}
      {amenagementLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {amenagementLabels.map((label, i) => (
            <span key={i} className="text-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#6B7280] px-2 py-0.5 rounded-full">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Interlocuteurs */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { checked: sit.medecin_travail_saisi, label: 'Médecin' },
          { checked: sit.sameth_saisi, label: 'SAMETH' },
          { checked: sit.cap_emploi_saisi, label: 'Cap Emploi' },
        ].map(({ checked, label }) => (
          <span key={label} className={cn(
            'flex items-center gap-1 text-[11px]',
            checked ? 'text-[#2E7D32]' : 'text-[#CBD5E1]'
          )}>
            {checked
              ? <CheckCircle2 className="w-3 h-3" />
              : <XCircle className="w-3 h-3" />
            }
            {label}
          </span>
        ))}
      </div>

      {/* Notes */}
      {sit.notes && (
        <p className="text-xs text-[#6B7280] italic border-t border-[#F1F5F9] pt-2">
          {sit.notes}
        </p>
      )}
    </div>
  )
}
