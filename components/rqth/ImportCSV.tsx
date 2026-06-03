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
  matricule: string
  _valide: boolean
  _erreurs: string[]
}

// ─── Valeurs du menu déroulant dans le modèle Excel ────────────────────────────
const TYPE_RECO_OPTIONS = [
  'RQTH',
  'AAH',
  'Pension invalidité 2e cat.',
  'Pension invalidité 3e cat.',
  'Rente AT/MP',
  'CMI Invalidité',
] as const

// ─── Mapping texte → clé interne (insensible à la casse) ──────────────────────
const TYPES_VALIDES: Record<string, TypeReconnaissance> = {
  // RQTH
  'rqth':                                                      'rqth',
  'rqth — reconnaissance qualité travailleur handicapé':       'rqth',
  // AAH
  'aah':                                                       'aah',
  'aah — allocation adulte handicapé':                         'aah',
  // Pension invalidité 2e
  'pension invalidité 2':                                      'pension_invalidite_2',
  'pension invalidité 2e cat.':                                'pension_invalidite_2', // menu déroulant modèle
  'pension invalidité 2ème cat':                               'pension_invalidite_2',
  'pension invalidité 2ème catégorie':                         'pension_invalidite_2',
  'pension_invalidite_2':                                      'pension_invalidite_2',
  // Pension invalidité 3e
  'pension invalidité 3':                                      'pension_invalidite_3',
  'pension invalidité 3e cat.':                                'pension_invalidite_3', // menu déroulant modèle
  'pension invalidité 3ème cat':                               'pension_invalidite_3',
  'pension invalidité 3ème catégorie':                         'pension_invalidite_3',
  'pension_invalidite_3':                                      'pension_invalidite_3',
  // Rente AT/MP
  'rente at/mp':                                               'rente_at_mp',
  'rente at/mp ≥ 10%':                                        'rente_at_mp',
  'rente_at_mp':                                               'rente_at_mp',
  // CMI Invalidité
  'cmi':                                                       'carte_mobilite_invalidite',
  'cmi-invalidité':                                            'carte_mobilite_invalidite',
  'cmi invalidité':                                            'carte_mobilite_invalidite', // menu déroulant modèle
  'carte mobilité inclusion':                                  'carte_mobilite_invalidite',
  'carte mobilité inclusion invalidité':                       'carte_mobilite_invalidite',
  'carte_mobilite_invalidite':                                 'carte_mobilite_invalidite',
}

// ─── Normalisation des en-têtes de colonnes ────────────────────────────────────
const HEADER_MAP: Record<string, string> = {
  // prenom
  'prenom':               'prenom',
  'prénom':               'prenom',
  'first name':           'prenom',
  'firstname':            'prenom',
  'given name':           'prenom',
  // nom
  'nom':                  'nom',
  'last name':            'nom',
  'lastname':             'nom',
  'family name':          'nom',
  'nom de famille':       'nom',
  // type_reconnaissance
  'type_reconnaissance':                     'type_reconnaissance',
  'type de reconnaissance':                  'type_reconnaissance',
  'type reconnaissance':                     'type_reconnaissance',
  'type':                                    'type_reconnaissance',
  'reconnaissance':                          'type_reconnaissance',
  'statut':                                  'type_reconnaissance',
  'handicap':                                'type_reconnaissance',
  // date_debut — y compris en-tête du modèle Excel
  'date_debut':                              'date_debut',
  'date début':                              'date_debut',
  'date de début':                           'date_debut',
  'date debut':                              'date_debut',
  'début':                                   'date_debut',
  'debut':                                   'date_debut',
  'start date':                              'date_debut',
  'date début (jj/mm/aaaa)':                'date_debut',
  // date_fin — y compris en-tête du modèle Excel
  'date_fin':                                'date_fin',
  'date fin':                                'date_fin',
  'date de fin':                             'date_fin',
  'fin':                                     'date_fin',
  'end date':                                'date_fin',
  'date fin (jj/mm/aaaa)':                  'date_fin',
  // est_permanent — y compris en-tête du modèle Excel
  'est_permanent':                           'est_permanent',
  'permanent':                               'est_permanent',
  'permanent ?':                             'est_permanent',
  'illimité':                                'est_permanent',
  // taux_temps_travail — y compris en-tête du modèle Excel
  'taux_temps_travail':                      'taux_temps_travail',
  'taux temps travail':                      'taux_temps_travail',
  'taux':                                    'taux_temps_travail',
  'temps travail':                           'taux_temps_travail',
  'etp':                                     'taux_temps_travail',
  'taux temps travail (%)':                  'taux_temps_travail',
  // date_naissance — y compris en-tête du modèle Excel
  'date_naissance':                          'date_naissance',
  'date naissance':                          'date_naissance',
  'date de naissance':                       'date_naissance',
  'naissance':                               'date_naissance',
  'birth date':                              'date_naissance',
  'date de naissance (jj/mm/aaaa)':         'date_naissance',
  // matricule — y compris en-tête du modèle Excel
  'matricule':                               'matricule',
  'code_interne':                            'matricule',
  'code interne':                            'matricule',
  'code interne / matricule':               'matricule',
  'id':                                      'matricule',
  'identifiant':                             'matricule',
}

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/"/g, '').replace(/\r/g, '')
  return HEADER_MAP[key] ?? key
}

/** Accepte : true/false, 1/0, Oui/Non (insensible à la casse) */
function parseBoolFr(val: string): boolean {
  const v = val.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'oui' || v === 'o'
}

/** Accepte dd/mm/yyyy (format français) et yyyy-mm-dd (ISO) */
function parseDate(val: string): string | null {
  if (!val) return null
  const fr = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`
  const iso = val.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return val
  return null
}

function parseCSV(text: string): LigneCSV[] {
  // Supprimer le BOM UTF-8 éventuel (export Excel Windows)
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Détection automatique du séparateur : tabulation, point-virgule ou virgule
  const firstLine = lines[0]
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(normalizeHeader)

  // Vérifier que les colonnes obligatoires sont présentes
  const required = ['prenom', 'nom', 'type_reconnaissance', 'date_debut']
  const missing = required.filter(r => !headers.includes(r))
  if (missing.length === required.length) {
    return [{
      prenom: '', nom: '', type_reconnaissance: '', date_debut: '',
      date_fin: '', est_permanent: '', taux_temps_travail: '100',
      date_naissance: '', matricule: '',
      _valide: false,
      _erreurs: [`Colonnes non reconnues. En-têtes détectés : "${headers.join('", "')}". Utilisez le modèle fourni.`],
    }]
  }

  return lines.slice(1).map(line => {
    const cells = line.split(sep).map(c => c.trim().replace(/"/g, '').replace(/\r/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })

    const erreurs: string[] = []
    if (!row['prenom']) erreurs.push('Prénom manquant')
    if (!row['nom']) erreurs.push('Nom manquant')
    if (!row['type_reconnaissance']) erreurs.push('Type de reconnaissance manquant')
    else if (!TYPES_VALIDES[row['type_reconnaissance'].toLowerCase()]) erreurs.push(`Type inconnu : ${row['type_reconnaissance']}`)
    if (!row['date_debut']) erreurs.push('Date de début manquante')
    else if (!parseDate(row['date_debut'])) erreurs.push('Date de début invalide (format attendu : JJ/MM/AAAA)')

    return {
      prenom:              row['prenom'] ?? '',
      nom:                 row['nom'] ?? '',
      type_reconnaissance: row['type_reconnaissance'] ?? '',
      date_debut:          row['date_debut'] ?? '',
      date_fin:            row['date_fin'] ?? '',
      est_permanent:       row['est_permanent'] ?? '',
      taux_temps_travail:  row['taux_temps_travail'] ?? '100',
      date_naissance:      row['date_naissance'] ?? '',
      matricule:           row['matricule'] ?? '',
      _valide:             erreurs.length === 0,
      _erreurs:            erreurs,
    }
  })
}

// ─── Génération du modèle Excel (.xlsx) avec ExcelJS ──────────────────────────
async function generateTemplateXlsx(): Promise<Blob> {
  const { Workbook } = await import('exceljs')
  const wb = new Workbook()
  wb.creator = 'Talenth'
  wb.created = new Date()

  // ── Feuille 1 : Import BOETH ─────────────────────────────────────────────────
  const ws = wb.addWorksheet('Import BOETH', {
    views: [{ state: 'frozen', ySplit: 2 }], // gèle les 2 premières lignes
    properties: { defaultColWidth: 20 },
  })

  ws.columns = [
    { key: 'prenom',              width: 18 },
    { key: 'nom',                 width: 22 },
    { key: 'type_reconnaissance', width: 30 },
    { key: 'date_debut',          width: 26 },
    { key: 'date_fin',            width: 24 },
    { key: 'est_permanent',       width: 15 },
    { key: 'taux_temps_travail',  width: 24 },
    { key: 'date_naissance',      width: 30 },
    { key: 'matricule',           width: 26 },
  ]

  // Ligne 1 — titres de colonnes
  const headerRow = ws.addRow([
    'Prénom',
    'Nom',
    'Type de reconnaissance',
    'Date début (jj/mm/aaaa)',
    'Date fin (jj/mm/aaaa)',
    'Permanent ?',
    'Taux temps travail (%)',
    'Date de naissance (jj/mm/aaaa)',
    'Code interne / Matricule',
  ])
  headerRow.height = 34
  headerRow.eachCell(cell => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4A8C' } }
    cell.font      = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10.5, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border    = { bottom: { style: 'thin', color: { argb: 'FF1E4A8C' } } }
  })

  // Ligne 2 — indications obligatoire / optionnel
  const subRow = ws.addRow([
    '★ Obligatoire',
    '★ Obligatoire',
    '★ Obligatoire — liste déroulante',
    '★ Obligatoire — JJ/MM/AAAA',
    'Optionnel — JJ/MM/AAAA',
    'Optionnel — Oui / Non',
    'Optionnel (défaut : 100)',
    'Optionnel — JJ/MM/AAAA',
    'Optionnel',
  ])
  subRow.height = 20
  subRow.eachCell((cell, colNum) => {
    const isRequired = colNum <= 4
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: isRequired ? 'FFFFF3E0' : 'FFEBF2FA' } }
    cell.font      = { size: 8.5, italic: true, name: 'Calibri',
                       color: { argb: isRequired ? 'FFB71C1C' : 'FF1E4A8C' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })

  // Exemples — lignes 3 → 5
  const examples = [
    ['Marie',  'Dupont',  'RQTH',                     '15/01/2023', '14/01/2026', 'Non', 100, '20/06/1985', 'EMP001'],
    ['Jean',   'Martin',  'AAH',                      '01/06/2022', '',           'Oui', 80,  '12/03/1970', 'EMP002'],
    ['Sophie', 'Bernard', 'Pension invalidité 2e cat.','15/03/2024', '',           'Oui', 100, '',           'EMP003'],
  ]
  examples.forEach((ex, idx) => {
    const row = ws.addRow(ex)
    row.height = 22
    row.eachCell(cell => {
      cell.font      = { size: 10, name: 'Calibri' }
      cell.alignment = { vertical: 'middle' }
      if (idx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
    })
  })

  // Validation liste déroulante — lignes 3 à 2002
  const typesList = TYPE_RECO_OPTIONS.join(',')
  for (let r = 3; r <= 2002; r++) {
    ws.getCell(`C${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${typesList}"`],
      showErrorMessage: true,
      errorStyle:  'warning',
      errorTitle:  'Valeur inconnue',
      error:       `Sélectionnez dans la liste : ${typesList}`,
    }
    ws.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Oui,Non"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Valeur invalide',
      error:      'Indiquez Oui ou Non',
    }
  }

  // ── Feuille 2 : Légende ──────────────────────────────────────────────────────
  const lg = wb.addWorksheet('Légende & aide')
  lg.columns = [
    { key: 'col',      width: 32 },
    { key: 'req',      width: 16 },
    { key: 'desc',     width: 56 },
    { key: 'ex',       width: 58 },
  ]

  const lgHeader = lg.addRow(['Colonne', 'Obligatoire ?', 'Description', 'Exemples / Valeurs acceptées'])
  lgHeader.height = 28
  lgHeader.eachCell(cell => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4A8C' } }
    cell.font      = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 10.5 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const lgData: [string, string, string, string][] = [
    ['Prénom',                        'Oui', 'Prénom du salarié BOETH',                                   'Marie, Jean, Sophie…'],
    ['Nom',                            'Oui', 'Nom de famille du salarié',                                 'Dupont, Martin, Bernard…'],
    ['Type de reconnaissance',         'Oui', 'Statut BOETH — utiliser la liste déroulante',               TYPE_RECO_OPTIONS.join(' · ')],
    ['Date début (jj/mm/aaaa)',        'Oui', 'Date de début de validité de la reconnaissance',            '15/01/2023  (format JJ/MM/AAAA uniquement)'],
    ['Date fin (jj/mm/aaaa)',          'Non', 'Date de fin de validité. Laisser vide si permanent',        '14/01/2026'],
    ['Permanent ?',                    'Non', 'Oui si la reconnaissance est illimitée (AAH, pension…)',    'Oui · Non  (défaut : Non)'],
    ['Taux temps travail (%)',         'Non', 'Pourcentage du temps de travail contractuel',               '100 = temps plein · 80 · 50  (défaut : 100)'],
    ['Date de naissance (jj/mm/aaaa)', 'Non', 'Date de naissance du salarié',                             '20/06/1985  (format JJ/MM/AAAA)'],
    ['Code interne / Matricule',       'Non', 'Matricule ou identifiant RH interne',                      'EMP001, M0042, 000123…'],
  ]

  lgData.forEach(([col, req, desc, ex], i) => {
    const row = lg.addRow([col, req, desc, ex])
    row.height = 26
    row.eachCell((cell, colNum) => {
      cell.font      = { size: 10, name: 'Calibri' }
      cell.alignment = { vertical: 'middle', wrapText: true }
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF2FA' } }
      if (colNum === 2 && req === 'Oui') cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FFB71C1C' } }
    })
  })

  lg.addRow([])
  const noteRow = lg.addRow([
    "ℹ️  Les lignes dont les colonnes obligatoires sont manquantes ou incorrectes sont ignorées lors de l'import. " +
    "Les dates peuvent aussi être saisies au format AAAA-MM-JJ (ex: 2023-01-15).",
  ])
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' }, size: 9, name: 'Calibri' }
  lg.mergeCells(`A${noteRow.number}:D${noteRow.number}`)
  noteRow.getCell(1).alignment = { wrapText: true }
  noteRow.height = 32

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function ImportCSV({ open, onClose, onSuccess, organizationId }: ImportCSVProps) {
  const supabase = useMemo(() => createClient(), [])
  const inputRef = useRef<HTMLInputElement>(null)
  const [lignes, setLignes] = useState<LigneCSV[]>([])
  const [importing, setImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [drag, setDrag] = useState(false)

  const lignesValides = lignes.filter(l => l._valide)
  const lignesErreur  = lignes.filter(l => !l._valide)

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'numbers') {
      toast.error('Format Numbers non supporté. Dans Numbers : Fichier → Exporter vers → CSV, puis uploadez le .csv')
      return
    }
    if (ext === 'xlsx' || ext === 'xls') {
      toast.error('Format Excel non supporté pour l\'import. Dans Excel : Fichier → Enregistrer sous → CSV UTF-8, puis uploadez le .csv')
      return
    }
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
        organization_id:   organizationId,
        prenom:            l.prenom.trim(),
        nom:               l.nom.trim(),
        type_reconnaissance: TYPES_VALIDES[l.type_reconnaissance.toLowerCase()],
        date_debut:        parseDate(l.date_debut),
        date_fin:          parseDate(l.date_fin) ?? null,
        // Permanent si explicitement "Oui" / true, ou si aucune date de fin fournie
        est_permanent:     parseBoolFr(l.est_permanent) || !parseDate(l.date_fin),
        taux_temps_travail: Math.min(100, Math.max(0, parseFloat(l.taux_temps_travail) || 100)),
        date_naissance:    parseDate(l.date_naissance) ?? null,
        matricule:         l.matricule.trim() || null,
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

  const downloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const blob = await generateTemplateXlsx()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modele_import_boeth_talenth.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur génération XLSX :', err)
      toast.error('Erreur lors de la génération du modèle')
    } finally {
      setDownloadingTemplate(false)
    }
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
              <p className="text-xs text-[#9CA3AF] mt-3">
                Format CSV uniquement pour l&apos;import · Séparateur virgule ou point-virgule accepté
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* Bandeau modèle Excel */}
          <div className="flex items-start gap-3 p-3.5 bg-[#EBF2FA] rounded-xl border border-[#1E4A8C]/20">
            <FileText className="w-5 h-5 text-[#1E4A8C] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E4A8C]">Modèle Excel à remplir</p>
              <p className="text-xs text-[#1E4A8C]/70 mt-0.5">
                Téléchargez le fichier <strong>.xlsx</strong> avec les colonnes prêtes, des listes déroulantes
                (type de reconnaissance, Oui/Non) et une feuille de légende. Une fois rempli, exportez-le
                en&nbsp;<strong>CSV</strong> depuis Excel puis importez-le ici.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-[#1E4A8C]/30 text-[#1E4A8C] hover:bg-[#1E4A8C]/10 shrink-0"
              onClick={downloadTemplate}
              disabled={downloadingTemplate}
            >
              {downloadingTemplate
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Génération…</>
                : <><Download className="w-3.5 h-3.5" />Modèle Excel</>
              }
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

              {/* Prévisualisation */}
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
                      {l.prenom || '—'} {l.nom || '(sans nom)'} — {l._erreurs.join(', ')}
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
