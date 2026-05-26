'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Download, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { TypeReconnaissance } from '@/types'

interface ImportCSVProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
}

interface LigneCSV {
  prenom: string
  nom: string
  type_reconnaissance: string
  date_debut: string
  date_fin: string
  est_permanent: string
  taux_temps_travail: string
  date_naissance: string
  code_interne: string
  _valide: boolean
  _erreurs: string[]
}

const TYPES_VALIDES: Record<string, TypeReconnaissance> = {
  // RQTH
  'rqth':                                        'rqth',
  'rqth — reconnaissance qualité travailleur handicapé': 'rqth',
  // AAH
  'aah':                                         'aah',
  'aah — allocation adulte handicapé':           'aah',
  // Pension invalidité 2e catégorie
  'pension invalidité 2':                        'pension_invalidite_2',
  'pension invalidité 2ème cat':                 'pension_invalidite_2',
  'pension invalidité 2ème catégorie':           'pension_invalidite_2',
  'pension_invalidite_2':                        'pension_invalidite_2',
  // Pension invalidité 3e catégorie
  'pension invalidité 3':                        'pension_invalidite_3',
  'pension invalidité 3ème cat':                 'pension_invalidite_3',
  'pension invalidité 3ème catégorie':           'pension_invalidite_3',
  'pension_invalidite_3':                        'pension_invalidite_3',
  // Rente AT/MP
  'rente at/mp':                                 'rente_at_mp',
  'rente_at_mp':                                 'rente_at_mp',
  // Carte mobilité inclusion — invalidité (ancienne CMI)
  'cmi':                                         'carte_mobilite_invalidite',
  'cmi-invalidité':                              'carte_mobilite_invalidite',
  'cmi invalidité':                              'carte_mobilite_invalidite',
  'carte mobilité inclusion':                    'carte_mobilite_invalidite',
  'carte mobilité inclusion invalidité':         'carte_mobilite_invalidite',
  'carte_mobilite_invalidite':                   'carte_mobilite_invalidite',
}

const CSV_TEMPLATE = `prenom,nom,type_reconnaissance,date_debut,date_fin,est_permanent,taux_temps_travail,date_naissance,code_interne
Marie,Dupont,RQTH,2023-01-15,2026-01-14,false,100,1985-06-20,EMP001
Jean,Martin,AAH,2022-06-01,,true,80,1970-03-12,EMP002
`

function parseDate(val: string): string | null {
  if (!val) return null
  // Accepte dd/mm/yyyy ou yyyy-mm-dd
  const fr = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`
  const iso = val.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return val
  return null
}

function parseCSV(text: string): LigneCSV[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const cells = line.split(sep).map(c => c.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })

    const erreurs: string[] = []
    if (!row['prenom']) erreurs.push('Prénom manquant')
    if (!row['nom']) erreurs.push('Nom manquant')
    if (!row['type_reconnaissance']) erreurs.push('Type de reconnaissance manquant')
    else if (!TYPES_VALIDES[row['type_reconnaissance'].toLowerCase()]) erreurs.push(`Type inconnu : ${row['type_reconnaissance']}`)
    if (!row['date_debut']) erreurs.push('Date de début manquante')
    else if (!parseDate(row['date_debut'])) erreurs.push('Date de début invalide (format attendu : YYYY-MM-DD)')

    return {
      prenom: row['prenom'] ?? '',
      nom: row['nom'] ?? '',
      type_reconnaissance: row['type_reconnaissance'] ?? '',
      date_debut: row['date_debut'] ?? '',
      date_fin: row['date_fin'] ?? '',
      est_permanent: row['est_permanent'] ?? 'false',
      taux_temps_travail: row['taux_temps_travail'] ?? '100',
      date_naissance: row['date_naissance'] ?? '',
      code_interne: row['code_interne'] ?? '',
      _valide: erreurs.length === 0,
      _erreurs: erreurs,
    }
  })
}

export function ImportCSV({ open, onClose, onSuccess, organizationId }: ImportCSVProps) {
  const supabase = useMemo(() => createClient(), [])
  const inputRef = useRef<HTMLInputElement>(null)
  const [lignes, setLignes] = useState<LigneCSV[]>([])
  const [importing, setImporting] = useState(false)
  const [drag, setDrag] = useState(false)

  const lignesValides = lignes.filter(l => l._valide)
  const lignesErreur = lignes.filter(l => !l._valide)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setLignes(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (lignesValides.length === 0) return
    setImporting(true)
    try {
      const payload = lignesValides.map(l => ({
        organization_id: organizationId,
        prenom: l.prenom.trim(),
        nom: l.nom.trim(),
        type_reconnaissance: TYPES_VALIDES[l.type_reconnaissance.toLowerCase()],
        date_debut: parseDate(l.date_debut),
        date_fin: parseDate(l.date_fin) ?? null,
        est_permanent: l.est_permanent.toLowerCase() === 'true' || l.est_permanent === '1' || !parseDate(l.date_fin),
        taux_temps_travail: Math.min(100, Math.max(0, parseFloat(l.taux_temps_travail) || 100)),
        date_naissance: parseDate(l.date_naissance) ?? null,
        code_interne: l.code_interne.trim() || null,
      }))

      const { error } = await supabase.from('rqth_employees').insert(payload)
      if (error) throw error

      toast.success(`${lignesValides.length} salarié${lignesValides.length > 1 ? 's' : ''} importé${lignesValides.length > 1 ? 's' : ''} avec succès`)
      setLignes([])
      onSuccess()
      onClose()
    } catch (err) {
      toast.error("Erreur lors de l'import")
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele_import_boeth.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => { setLignes([]); if (inputRef.current) inputRef.current.value = '' }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des salariés BOETH depuis un fichier CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de drop */}
          {lignes.length === 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                drag ? 'border-[#1E4A8C] bg-[#EBF2FA]' : 'border-[#E2E8F0] hover:border-[#1E4A8C]/40 hover:bg-[#F8FAFC]'
              }`}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-[#6B7280] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#1A1A2E]">Glissez votre fichier CSV ici</p>
              <p className="text-xs text-[#6B7280] mt-1">ou cliquez pour parcourir</p>
              <p className="text-xs text-[#9CA3AF] mt-3">Format CSV avec séparateur virgule ou point-virgule · Encodage UTF-8</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* Template */}
          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1E4A8C]" />
              <p className="text-xs text-[#6B7280]">
                Pas sûr du format ? Téléchargez le modèle avec les bonnes colonnes et 2 exemples.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5" />
              Modèle CSV
            </Button>
          </div>

          {/* Résultats parsing */}
          {lignes.length > 0 && (
            <div className="space-y-3">
              {/* Résumé */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {lignesValides.length} valide{lignesValides.length !== 1 ? 's' : ''}
                  </span>
                  {lignesErreur.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {lignesErreur.length} erreur{lignesErreur.length !== 1 ? 's' : ''} (ignorées)
                    </span>
                  )}
                </div>
                <button onClick={reset} className="text-xs text-[#6B7280] hover:text-[#1A1A2E] flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Changer de fichier
                </button>
              </div>

              {/* Prévisualisation (50 premières lignes valides) */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F8FAFC] sticky top-0">
                      <tr>
                        {['Prénom', 'Nom', 'Type', 'Début', 'Fin', 'Taux', 'Naissance'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {lignesValides.slice(0, 50).map((l, i) => (
                        <tr key={i} className="bg-white hover:bg-[#F8FAFC]">
                          <td className="px-3 py-1.5 font-medium text-[#1A1A2E]">{l.prenom}</td>
                          <td className="px-3 py-1.5 text-[#1A1A2E]">{l.nom}</td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{l.type_reconnaissance}</td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{l.date_debut}</td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{l.date_fin || '—'}</td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{l.taux_temps_travail}%</td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{l.date_naissance || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {lignesValides.length > 50 && (
                  <div className="px-3 py-2 text-xs text-[#9CA3AF] bg-[#F8FAFC] border-t border-[#E2E8F0]">
                    … et {lignesValides.length - 50} autre{lignesValides.length - 50 > 1 ? 's' : ''} ligne{lignesValides.length - 50 > 1 ? 's' : ''} valide{lignesValides.length - 50 > 1 ? 's' : ''} (toutes seront importées)
                  </div>
                )}
              </div>

              {/* Erreurs */}
              {lignesErreur.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Lignes ignorées ({lignesErreur.length})
                  </p>
                  {lignesErreur.slice(0, 5).map((l, i) => (
                    <p key={i} className="text-xs text-orange-600 ml-5">
                      {l.prenom} {l.nom || '(sans nom)'} — {l._erreurs.join(', ')}
                    </p>
                  ))}
                  {lignesErreur.length > 5 && (
                    <p className="text-xs text-orange-500 ml-5">… et {lignesErreur.length - 5} autre(s) erreur(s)</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => { reset(); onClose() }} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || lignesValides.length === 0}
                  className="flex-1 gap-2"
                >
                  {importing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Import en cours…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" />Importer {lignesValides.length} salarié{lignesValides.length !== 1 ? 's' : ''}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
