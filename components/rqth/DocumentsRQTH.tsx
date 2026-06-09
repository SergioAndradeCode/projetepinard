'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  FileText, Upload, Trash2, Download, Loader2,
  FolderOpen, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RQTHEmployee, RQTHDocument, TypeDocument } from '@/types'
import { LABEL_TYPE_DOCUMENT } from '@/types'

const TYPE_COLORS: Record<TypeDocument, string> = {
  rqth:            'bg-blue-50 text-blue-700 border-blue-200',
  facture:         'bg-green-50 text-green-700 border-green-200',
  maintien_emploi: 'bg-purple-50 text-purple-700 border-purple-200',
  autre:           'bg-gray-50 text-gray-600 border-gray-200',
}

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

interface DocumentsRQTHProps {
  employee: RQTHEmployee
  organizationId: string
  open: boolean
  onClose: () => void
  readonly?: boolean
}

export function DocumentsRQTH({ employee, organizationId, open, onClose, readonly = false }: DocumentsRQTHProps) {
  const supabase = createClient()
  const [documents, setDocuments] = useState<RQTHDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [typeUpload, setTypeUpload] = useState<TypeDocument>('rqth')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rqth_documents')
      .select('*')
      .eq('rqth_employee_id', employee.id)
      .order('created_at', { ascending: false })
    if (!error) setDocuments(data ?? [])
    setLoading(false)
  }, [supabase, employee.id])

  useEffect(() => {
    if (open) loadDocuments()
  }, [open, loadDocuments])

  const handleUpload = async (file: File) => {
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
      const timestamp = Date.now()
      const storagePath = `${organizationId}/${employee.id}/${timestamp}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('rqth-documents')
        .upload(storagePath, file, { upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('rqth_documents').insert({
        rqth_employee_id: employee.id,
        organization_id: organizationId,
        nom_fichier: file.name,
        type_document: typeUpload,
        storage_path: storagePath,
        taille: file.size,
        uploaded_by: user?.id ?? null,
      })

      if (dbError) {
        // rollback storage
        await supabase.storage.from('rqth-documents').remove([storagePath])
        throw dbError
      }

      toast.success('Document ajouté')
      await loadDocuments()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

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

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingDelete(true)
    const doc = documents.find(d => d.id === deleteId)
    if (doc) {
      await supabase.storage.from('rqth-documents').remove([doc.storage_path])
    }
    const { error } = await supabase.from('rqth_documents').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Document supprimé')
      await loadDocuments()
    }
    setDeleteId(null)
    setLoadingDelete(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EBF2FA] rounded-lg flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-[#1E4A8C]" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-[#1A1A2E]">
                  Dossier de {employee.prenom} {employee.nom}
                </SheetTitle>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Zone upload */}
            {!readonly && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Ajouter un document
                </p>
                {/* Sélecteur type */}
                <Select value={typeUpload} onValueChange={(v) => setTypeUpload(v as TypeDocument)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(LABEL_TYPE_DOCUMENT) as [TypeDocument, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-all',
                    isDragging
                      ? 'border-[#1E4A8C] bg-[#EBF2FA]'
                      : 'border-[#E2E8F0] hover:border-[#1E4A8C]/40 hover:bg-[#F8FAFC]',
                    uploading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-[#1E4A8C] animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#6B7280]" />
                  )}
                  <p className="text-sm text-[#6B7280] text-center">
                    {uploading
                      ? 'Upload en cours…'
                      : <><span className="font-medium text-[#1E4A8C]">Cliquez</span> ou déposez un fichier</>
                    }
                  </p>
                  <p className="text-xs text-[#CBD5E1]">PDF, image, Word, max {MAX_SIZE_MB} Mo</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Liste documents */}
            <div className="space-y-2">
              {!readonly && (
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Documents enregistrés
                </p>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1E4A8C]" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle className="w-8 h-8 text-[#CBD5E1] mb-2" />
                  <p className="text-sm text-[#6B7280]">Aucun document pour ce salarié</p>
                  {!readonly && (
                    <p className="text-xs text-[#CBD5E1] mt-1">Ajoutez sa décision RQTH ou une facture</p>
                  )}
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#EBF2FA] rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#1E4A8C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{doc.nom_fichier}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                          TYPE_COLORS[doc.type_document]
                        )}>
                          {LABEL_TYPE_DOCUMENT[doc.type_document]}
                        </span>
                        {doc.taille && (
                          <span className="text-[11px] text-[#CBD5E1]">{formatBytes(doc.taille)}</span>
                        )}
                        <span className="text-[11px] text-[#CBD5E1]">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-[#6B7280] hover:text-[#1E4A8C]"
                        onClick={() => handleDownload(doc)}
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      {!readonly && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-[#6B7280] hover:text-[#B71C1C] hover:bg-red-50"
                          onClick={() => setDeleteId(doc.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation suppression */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le document ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            Le fichier sera définitivement supprimé. Cette action est irréversible.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loadingDelete}>
              {loadingDelete && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
