import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'
import { createFormattedSheet, generateExcelBuffer } from '@/lib/excel/builder'
import { EXCEL_THEME } from '@/lib/excel/theme'
import {
  getCoefficientContribution,
  estimerDeductionESAT,
  filtrerSalariesPourAnnee,
  getUBProratee,
  getMoisPresencePourAnnee,
  calculerUBRQTHPourAnnee,
} from '@/lib/oeth/calculs'
import {
  drawDonutCategories,
  drawBarBudgetSites,
  drawBarMensuel,
  drawHorizontalBarCategories,
} from '@/lib/excel/charts'
import {
  BUDGET_CATEGORIES_LABELS,
  LABEL_RECONNAISSANCE,
  type BudgetAllocation,
  type BudgetExpense,
  type Establishment,
  type ESATPurchase,
  type RQTHEmployee,
  type BudgetCategorie,
} from '@/types'

const TODAY = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 401 })
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { type, data } = await req.json()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Talenth'
    workbook.created = new Date()

    switch (type) {
      case 'budget': await buildBudgetExport(workbook, data); break
      case 'rqth':   buildRQTHExport(workbook, data); break
      case 'esat':   buildESATExport(workbook, data); break
      case 'doeth':  buildDOETHExport(workbook, data); break
      default: return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    const buffer = await generateExcelBuffer(workbook)
    const filename = `Talenth_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────────────────
async function buildBudgetExport(
  wb: ExcelJS.Workbook,
  data: {
    orgName: string
    year: number
    etablissements: Establishment[]
    allocations: BudgetAllocation[]
    expenses: BudgetExpense[]
  }
) {
  const { orgName, year, etablissements, allocations, expenses } = data

  const totalBudget = allocations.reduce((s, a) => s + (a.montant_total ?? 0), 0)
  const totalDepense = expenses.reduce((s, d) => s + (d.montant ?? 0), 0)
  const taux = totalBudget > 0 ? (totalDepense / totalBudget) * 100 : 0

  const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

  // ── Données pour graphiques ──
  const catData = Object.entries(BUDGET_CATEGORIES_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: expenses.filter(d => d.categorie === key).reduce((s, d) => s + d.montant, 0),
    }))
    .filter(d => d.value > 0)

  const siteChartData = etablissements.map(e => ({
    name: e.name,
    budget: allocations.find(a => a.establishment_id === e.id)?.montant_total ?? 0,
    depenses: expenses.filter(d => d.establishment_id === e.id).reduce((s, d) => s + d.montant, 0),
  }))

  const mensuelData = MOIS.map((mois, i) => ({
    mois,
    depenses: expenses
      .filter(d => new Date(d.date_depense).getMonth() === i && new Date(d.date_depense).getFullYear() === year)
      .reduce((s, d) => s + d.montant, 0),
    budget: totalBudget > 0 ? Math.round(totalBudget / 12) : 0,
  }))

  const catBarData = Object.entries(BUDGET_CATEGORIES_LABELS)
    .map(([key, label]) => {
      const val = expenses.filter(d => d.categorie === key).reduce((s, d) => s + d.montant, 0)
      return { name: label, value: val, pct: totalDepense > 0 ? (val / totalDepense) * 100 : 0 }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // ── Générer les graphiques côté serveur ──
  const [pngDonut, pngSites, pngMensuel, pngCatBar] = await Promise.all([
    Promise.resolve(drawDonutCategories(catData)),
    Promise.resolve(drawBarBudgetSites(siteChartData)),
    Promise.resolve(drawBarMensuel(mensuelData, year)),
    Promise.resolve(drawHorizontalBarCategories(catBarData)),
  ])

  function embedImg(buf: Buffer): number {
    // @ts-expect-error Buffer<ArrayBufferLike> vs Buffer mismatch between @napi-rs/canvas and exceljs types
    return wb.addImage({ buffer: buf, extension: 'png' })
  }

  // ── Onglet 1 : Résumé visuel ──
  const ws1 = wb.addWorksheet('Résumé Budget')
  ws1.columns = Array(8).fill(null).map(() => ({ width: 16 }))

  ws1.addRow([])
  const titleRow = ws1.addRow([`BUDGET MISSION HANDICAP | ${orgName}, ${year}`])
  ws1.mergeCells('A2:H2'); titleRow.height = 36
  styleTitle(titleRow.getCell(1))

  const subRow = ws1.addRow([`Exporté le ${TODAY}`])
  ws1.mergeCells('A3:H3'); subRow.height = 22
  styleSubtitle(subRow.getCell(1))

  ws1.addRow([])

  // KPIs (3 colonnes)
  const kpiRow1 = ws1.addRow(['Budget Global', '', '', 'Total Dépensé', '', '', 'Taux Consommé', ''])
  const kpiRow2 = ws1.addRow([formatEuros(totalBudget), '', '', formatEuros(totalDepense), '', '', taux.toFixed(1) + ' %', ''])
  ws1.mergeCells('A5:C5'); ws1.mergeCells('D5:F5'); ws1.mergeCells('G5:H5')
  ws1.mergeCells('A6:C6'); ws1.mergeCells('D6:F6'); ws1.mergeCells('G6:H6')
  const kpiColors = [EXCEL_THEME.primary, EXCEL_THEME.secondary, taux >= 90 ? EXCEL_THEME.danger : taux >= 70 ? EXCEL_THEME.warning : EXCEL_THEME.success]
  ;[1, 4, 7].forEach((col, i) => {
    for (const row of [kpiRow1, kpiRow2]) {
      const cell = row.getCell(col)
      cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + kpiColors[i] } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
    kpiRow1.height = 22; kpiRow2.height = 30
  })

  ws1.addRow([])

  // Donut catégories (800×420 → affichage 640×336)
  const donutId = embedImg(pngDonut)
  ws1.addImage(donutId, { tl: { col: 0, row: 7 }, ext: { width: 640, height: 336 } })
  for (let r = 8; r <= 26; r++) { const row = ws1.getRow(r); if (!row.height) row.height = 18 }

  // Bar mensuelle (800×380 → 640×304)
  const mensuelId = embedImg(pngMensuel)
  ws1.addImage(mensuelId, { tl: { col: 0, row: 27 }, ext: { width: 640, height: 304 } })
  for (let r = 28; r <= 44; r++) { const row = ws1.getRow(r); if (!row.height) row.height = 18 }

  // ── Onglet 2 : Par établissement ──
  const ws2 = wb.addWorksheet('Par établissement')
  ws2.columns = Array(8).fill(null).map(() => ({ width: 16 }))

  ws2.addRow([])
  const t2 = ws2.addRow([`BUDGET PAR ÉTABLISSEMENT | ${year}`])
  ws2.mergeCells('A2:H2'); t2.height = 32; styleTitle(t2.getCell(1))
  const s2 = ws2.addRow([` | Exporté le ${TODAY}`])
  ws2.mergeCells('A3:H3'); s2.height = 20; styleSubtitle(s2.getCell(1))
  ws2.addRow([])

  // Graphique barres sites (800×420 → 640×336)
  const sitesId = embedImg(pngSites)
  ws2.addImage(sitesId, { tl: { col: 0, row: 4 }, ext: { width: 640, height: 336 } })
  for (let r = 5; r <= 23; r++) { const row = ws2.getRow(r); if (!row.height) row.height = 18 }

  // Tableau récapitulatif sous le graphique
  const siteRows = etablissements.map(e => {
    const budget = allocations.find(a => a.establishment_id === e.id)?.montant_total ?? 0
    const depense = expenses.filter(d => d.establishment_id === e.id).reduce((s, d) => s + d.montant, 0)
    const restant = budget - depense
    const tauxSite = budget > 0 ? (depense / budget) * 100 : 0
    return { etablissement: e.name, budget, depense, restant, taux: tauxSite }
  })

  const startDataRow = 26
  const headers = ['Établissement', 'Budget alloué (€)', 'Dépensé (€)', 'Restant (€)', 'Taux (%)']
  const hRow = ws2.getRow(startDataRow)
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.primary } }
    cell.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' }
  })
  hRow.height = 22

  siteRows.forEach((r, idx) => {
    const row = ws2.getRow(startDataRow + 1 + idx)
    row.getCell(1).value = r.etablissement
    row.getCell(2).value = r.budget; row.getCell(2).numFmt = '#,##0.00 €'
    row.getCell(3).value = r.depense; row.getCell(3).numFmt = '#,##0.00 €'
    row.getCell(4).value = r.restant; row.getCell(4).numFmt = '#,##0.00 €'
    row.getCell(5).value = r.taux / 100; row.getCell(5).numFmt = '0.0%'
    row.getCell(4).font = { name: 'Calibri', size: 11, bold: true, color: { argb: r.restant < 0 ? 'FF' + EXCEL_THEME.danger : 'FF' + EXCEL_THEME.success } }
    row.height = 20
    ;[1, 2, 3, 4, 5].forEach(c => {
      const cell = row.getCell(c)
      cell.font = cell.font ?? { name: 'Calibri', size: 11 }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
    })
  })

  // ── Onglet 3 : Dépenses détaillées ──
  const detailRows = [...expenses].sort((a, b) => b.date_depense.localeCompare(a.date_depense)).map(d => ({
    date: d.date_depense,
    etablissement: etablissements.find(e => e.id === d.establishment_id)?.name ?? '-',
    categorie: BUDGET_CATEGORIES_LABELS[d.categorie as BudgetCategorie] ?? d.categorie,
    description: d.description,
    facture_ref: d.facture_ref ?? '-',
    montant: d.montant,
  }))

  const ws3 = createFormattedSheet(wb, 'Dépenses détaillées',
    `DÉPENSES MISSION HANDICAP | ${year}`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Date', key: 'date', format: 'date', align: 'center', width: 12 },
      { header: 'Établissement', key: 'etablissement', align: 'left' },
      { header: 'Catégorie', key: 'categorie', align: 'left' },
      { header: 'Description', key: 'description', align: 'left', width: 32 },
      { header: 'Réf. facture', key: 'facture_ref', align: 'left' },
      { header: 'Montant HT (€)', key: 'montant', format: 'currency', align: 'right' },
    ],
    detailRows,
    { date: '', etablissement: '', categorie: '', description: 'TOTAL', facture_ref: '', montant: totalDepense }
  )
  ws3.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + detailRows.length, column: 6 } }

  // ── Onglet 4 : Par catégorie ──
  const ws4 = wb.addWorksheet('Par catégorie')
  ws4.columns = Array(6).fill(null).map(() => ({ width: 18 }))

  ws4.addRow([])
  const t4 = ws4.addRow([`DÉPENSES PAR CATÉGORIE | ${year}`])
  ws4.mergeCells('A2:F2'); t4.height = 32; styleTitle(t4.getCell(1))
  const s4 = ws4.addRow([` | Exporté le ${TODAY}`])
  ws4.mergeCells('A3:F3'); s4.height = 20; styleSubtitle(s4.getCell(1))
  ws4.addRow([])

  // Graphique barres horizontales (800×variable → 560×adapt)
  const chartH4 = Math.max(280, 80 + catBarData.length * 52)
  const catBarId = embedImg(pngCatBar)
  ws4.addImage(catBarId, { tl: { col: 0, row: 4 }, ext: { width: 560, height: Math.round(chartH4 * 0.7) } })
  const chartRows4 = Math.ceil(chartH4 * 0.7 / 18) + 2
  for (let r = 5; r <= 4 + chartRows4; r++) { const row = ws4.getRow(r); if (!row.height) row.height = 18 }

  const categories = catBarData.map(d => ({
    categorie: d.name,
    nb: expenses.filter(e => BUDGET_CATEGORIES_LABELS[e.categorie as BudgetCategorie] === d.name).length,
    total: d.value,
    pct: d.pct,
  }))

  createFormattedSheet(
    wb,
    '_cat_data',
    `DÉPENSES PAR CATÉGORIE | ${year}`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Catégorie', key: 'categorie', align: 'left' },
      { header: 'Nb dépenses', key: 'nb', align: 'center', width: 14 },
      { header: 'Total (€)', key: 'total', format: 'currency', align: 'right' },
      { header: '% du total', key: 'pct', format: 'percent', align: 'center', width: 14 },
    ],
    categories,
    { categorie: 'TOTAL', nb: categories.reduce((s, c) => s + c.nb, 0), total: totalDepense, pct: 100 }
  )

  // On copie les données du sheet temporaire dans ws4 à partir de la bonne ligne
  const tempSheet = wb.getWorksheet('_cat_data')
  if (tempSheet) {
    const insertRow = 4 + chartRows4 + 2
    const hRowCat = ws4.getRow(insertRow)
    const srcHRow = tempSheet.getRow(5)
    srcHRow.eachCell((cell, col) => {
      const dest = hRowCat.getCell(col)
      dest.value = cell.value
      dest.font = cell.font
      dest.fill = cell.fill
      dest.alignment = cell.alignment
    })
    hRowCat.height = 22
    tempSheet.eachRow((row, rowNum) => {
      if (rowNum <= 5) return
      const destRow = ws4.getRow(insertRow + rowNum - 5)
      row.eachCell((cell, col) => {
        const dest = destRow.getCell(col)
        dest.value = cell.value
        dest.numFmt = cell.numFmt
        dest.font = cell.font
        dest.border = cell.border
      })
      destRow.height = 20
    })
    wb.removeWorksheet(tempSheet.id)
  }
}

// ─────────────────────────────────────────────────────────
// RQTH
// ─────────────────────────────────────────────────────────
function buildRQTHExport(
  wb: ExcelJS.Workbook,
  data: { orgName: string; salaries: RQTHEmployee[]; etablissements: Establishment[] }
) {
  const { orgName, salaries, etablissements } = data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const enriched = salaries.map(s => {
    const statut = getStatut(s.date_fin, s.est_permanent)
    const joursRestants = s.est_permanent || !s.date_fin
      ? null
      : Math.ceil((new Date(s.date_fin).getTime() - today.getTime()) / 86400000)
    return {
      ...s,
      statut,
      joursRestants,
      etablissementName: etablissements.find(e => e.id === s.establishment_id)?.name ?? '-',
      typeLabel: LABEL_RECONNAISSANCE[s.type_reconnaissance]?.split(', ')[0] ?? s.type_reconnaissance,
    }
  })

  // ── Onglet 1 : Liste complète ──
  const ws1 = createFormattedSheet(wb, 'Salariés RQTH',
    `SALARIÉS RQTH : ${orgName}`,
    `Exporté le ${TODAY}`,
    [
      { header: 'Prénom', key: 'prenom', align: 'left' },
      { header: 'Nom', key: 'nom', align: 'left' },
      { header: 'Matricule', key: 'matricule', align: 'center', width: 14 },
      { header: 'Établissement', key: 'etablissementName', align: 'left' },
      { header: 'Bâtiment / Lieu', key: 'batiment', align: 'left', width: 20 },
      { header: 'Type de reconnaissance', key: 'typeLabel', align: 'left', width: 28 },
      { header: 'Date début', key: 'date_debut', format: 'date', align: 'center', width: 13 },
      { header: 'Date fin', key: 'date_fin', format: 'date', align: 'center', width: 13 },
      { header: 'Statut', key: 'statut', align: 'center', width: 16 },
      { header: 'Jours restants', key: 'joursRestants', align: 'right', width: 15 },
    ],
    enriched.map(s => ({
      prenom: s.prenom,
      nom: s.nom,
      matricule: s.matricule ?? '-',
      etablissementName: s.etablissementName,
      batiment: s.batiment ?? '-',
      typeLabel: s.typeLabel,
      date_debut: s.date_debut,
      date_fin: s.est_permanent ? 'Permanente' : (s.date_fin ?? '-'),
      statut: s.statut === 'actif' ? 'Actif' : s.statut === 'expire_bientot' ? 'Expire bientôt' : 'Expiré',
      joursRestants: s.joursRestants ?? '∞',
    }))
  )

  // Colorisation conditionnelle du statut (colonne I = index 9, batiment décale d'une position)
  ws1.eachRow((row, rowNumber) => {
    if (rowNumber <= 5) return
    const statutCell = row.getCell(9)
    const val = String(statutCell.value ?? '')
    if (val === 'Expiré') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.dangerLight } }
      statutCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF' + EXCEL_THEME.danger }, bold: true }
    } else if (val === 'Expire bientôt') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.warningLight } }
      statutCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF' + EXCEL_THEME.warning }, bold: true }
    } else if (val === 'Actif') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.successLight } }
      statutCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF' + EXCEL_THEME.success }, bold: true }
    }
  })

  // ── Onglet 2 : Récap par établissement ──
  const recapSites = etablissements.map(e => {
    const sal = enriched.filter(s => s.establishment_id === e.id)
    const actifs = sal.filter(s => s.statut === 'actif').length
    const expireBientot = sal.filter(s => s.statut === 'expire_bientot').length
    const expires = sal.filter(s => s.statut === 'expire').length
    const ubTotal = sal.filter(s => s.statut !== 'expire').reduce((sum, s) => sum + s.taux_temps_travail / 100, 0)
    return { etablissement: e.name, actifs, expireBientot, expires, ubTotal }
  })

  createFormattedSheet(wb, 'Par établissement',
    `RÉCAPITULATIF PAR ÉTABLISSEMENT`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Établissement', key: 'etablissement', align: 'left' },
      { header: 'RQTH actifs', key: 'actifs', align: 'center', width: 14 },
      { header: 'Expirent < 90j', key: 'expireBientot', align: 'center', width: 16 },
      { header: 'Expirés', key: 'expires', align: 'center', width: 12 },
      { header: 'Total UB', key: 'ubTotal', align: 'right', width: 12 },
    ],
    recapSites,
    {
      etablissement: 'TOTAL',
      actifs: recapSites.reduce((s, r) => s + r.actifs, 0),
      expireBientot: recapSites.reduce((s, r) => s + r.expireBientot, 0),
      expires: recapSites.reduce((s, r) => s + r.expires, 0),
      ubTotal: recapSites.reduce((s, r) => s + r.ubTotal, 0),
    }
  )

  // ── Onglet 3 : Alertes expirations ──
  const alertes = enriched
    .filter(s => s.joursRestants !== null && s.joursRestants <= 120)
    .sort((a, b) => (a.joursRestants ?? 0) - (b.joursRestants ?? 0))

  const ws3 = createFormattedSheet(wb, 'Alertes expirations',
    'ALERTES : RECONNAISSANCES À RENOUVELER',
    `${orgName}, Reconnaissances expirant dans moins de 120 jours, ${TODAY}`,
    [
      { header: 'Prénom', key: 'prenom', align: 'left' },
      { header: 'Nom', key: 'nom', align: 'left' },
      { header: 'Établissement', key: 'etablissementName', align: 'left' },
      { header: 'Type', key: 'typeLabel', align: 'left', width: 28 },
      { header: "Date d'expiration", key: 'date_fin', format: 'date', align: 'center', width: 18 },
      { header: 'Jours restants', key: 'joursRestants', align: 'right', width: 15 },
    ],
    alertes.map(s => ({
      prenom: s.prenom, nom: s.nom,
      etablissementName: s.etablissementName,
      typeLabel: s.typeLabel,
      date_fin: s.date_fin,
      joursRestants: s.joursRestants,
    }))
  )

  // Colorer les jours restants selon urgence
  ws3.eachRow((row, rowNumber) => {
    if (rowNumber <= 5) return
    const jCell = row.getCell(6)
    const jours = Number(jCell.value ?? 999)
    if (jours < 0) {
      jCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.danger } }
    } else if (jours <= 30) {
      jCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.danger } }
    } else if (jours <= 90) {
      jCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.warning } }
    }
  })
}

// ─────────────────────────────────────────────────────────
// ESAT
// ─────────────────────────────────────────────────────────
function buildESATExport(
  wb: ExcelJS.Workbook,
  data: { orgName: string; achats: ESATPurchase[]; etablissements: Establishment[]; smicRef: number }
) {
  const { orgName, achats = [], etablissements = [] } = data

  const enriched = achats.map(a => ({
    ...a,
    etablissementName: etablissements.find(e => e.id === a.establishment_id)?.name ?? '-',
    deduction_estimee: a.montant_ht * 0.3,
  }))

  const totalHT = enriched.reduce((s, a) => s + a.montant_ht, 0)
  const totalDeduction = enriched.reduce((s, a) => s + a.deduction_estimee, 0)

  // ── Onglet 1 : Tous les achats ──
  const ws1 = createFormattedSheet(wb, 'Achats ESAT-EA',
    `ACHATS ESAT/EA | ${orgName}`,
    `Exporté le ${TODAY}`,
    [
      { header: 'Date', key: 'date_facture', format: 'date', align: 'center', width: 13 },
      { header: 'Établissement', key: 'etablissementName', align: 'left' },
      { header: 'Fournisseur ESAT/EA', key: 'fournisseur', align: 'left', width: 26 },
      { header: 'Montant HT (€)', key: 'montant_ht', format: 'currency', align: 'right' },
      { header: 'Déduction estimée (30%)', key: 'deduction_estimee', format: 'currency', align: 'right', width: 22 },
      { header: 'Notes', key: 'notes', align: 'left', width: 24 },
    ],
    enriched.map(a => ({
      date_facture: a.date_facture,
      etablissementName: a.etablissementName,
      fournisseur: a.fournisseur,
      montant_ht: a.montant_ht,
      deduction_estimee: parseFloat(a.deduction_estimee.toFixed(2)),
      notes: a.notes ?? '-',
    })),
    { date_facture: '', etablissementName: '', fournisseur: 'TOTAL', montant_ht: totalHT, deduction_estimee: parseFloat(totalDeduction.toFixed(2)), notes: '' }
  )
  ws1.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + enriched.length, column: 6 } }

  // ── Onglet 2 : Par établissement ──
  const recapSites = etablissements.map(e => {
    const sitAchats = enriched.filter(a => a.establishment_id === e.id)
    return {
      etablissement: e.name,
      nb: sitAchats.length,
      totalHT: sitAchats.reduce((s, a) => s + a.montant_ht, 0),
      totalDeduction: parseFloat(sitAchats.reduce((s, a) => s + a.deduction_estimee, 0).toFixed(2)),
    }
  }).filter(r => r.nb > 0)

  const ws2 = createFormattedSheet(wb, 'Par établissement',
    `ACHATS ESAT/EA PAR ÉTABLISSEMENT`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Établissement', key: 'etablissement', align: 'left' },
      { header: 'Nb achats', key: 'nb', align: 'center', width: 12 },
      { header: 'Total HT (€)', key: 'totalHT', format: 'currency', align: 'right' },
      { header: 'Déduction estimée (€)', key: 'totalDeduction', format: 'currency', align: 'right', width: 22 },
    ],
    recapSites,
    {
      etablissement: 'TOTAL ENTREPRISE',
      nb: enriched.length,
      totalHT,
      totalDeduction: parseFloat(totalDeduction.toFixed(2)),
    }
  )

  // Note légale
  ws2.addRow([])
  const noteRow = ws2.addRow(['ℹ Depuis 2020, les achats EA/ESAT/TIH génèrent une déduction monétaire (non des UB). Montant exact fourni par l\'attestation annuelle de l\'EA/ESAT avant le 31 janvier. Estimation = 30% du HT.'])
  ws2.mergeCells(`A${noteRow.number}:D${noteRow.number}`)
  noteRow.height = 32
  noteRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
  noteRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } }
  noteRow.getCell(1).alignment = { wrapText: true, vertical: 'middle' }

  // ── Onglet 3 : Par fournisseur ──
  const fournisseurs = new Map<string, { nb: number; totalHT: number; totalDeduction: number }>()
  enriched.forEach(a => {
    const existing = fournisseurs.get(a.fournisseur) ?? { nb: 0, totalHT: 0, totalDeduction: 0 }
    fournisseurs.set(a.fournisseur, {
      nb: existing.nb + 1,
      totalHT: existing.totalHT + a.montant_ht,
      totalDeduction: existing.totalDeduction + a.deduction_estimee,
    })
  })
  const fournRows = Array.from(fournisseurs.entries())
    .sort((a, b) => b[1].totalHT - a[1].totalHT)
    .map(([fournisseur, v]) => ({ fournisseur, ...v, totalDeduction: parseFloat(v.totalDeduction.toFixed(2)) }))

  createFormattedSheet(wb, 'Par fournisseur',
    `ACHATS ESAT/EA PAR FOURNISSEUR`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Fournisseur', key: 'fournisseur', align: 'left', width: 28 },
      { header: 'Nb factures', key: 'nb', align: 'center', width: 13 },
      { header: 'Total HT (€)', key: 'totalHT', format: 'currency', align: 'right' },
      { header: 'Déduction estimée (€)', key: 'totalDeduction', format: 'currency', align: 'right', width: 22 },
    ],
    fournRows,
    { fournisseur: 'TOTAL', nb: enriched.length, totalHT, totalDeduction: parseFloat(totalDeduction.toFixed(2)) }
  )
}

// ─────────────────────────────────────────────────────────
// DOETH
// ─────────────────────────────────────────────────────────
function buildDOETHExport(
  wb: ExcelJS.Workbook,
  data: {
    orgName: string
    annee: number
    etablissements: Establishment[]
    salaries: RQTHEmployee[]
    achats: ESATPurchase[]
    stagiaires: number
    deductionESAT: number
    deductionAccords: number
    deductionAutres: number
  },
) {
  const { orgName, annee, etablissements, salaries, achats, stagiaires, deductionESAT, deductionAccords, deductionAutres } = data

  const smicRef = etablissements[0]?.smic_horaire_ref ?? 11.88
  const effectifTotal = etablissements.reduce((s, e) => s + e.effectif_assujettissement, 0)

  // Filtrer et proratiser les UB par année de référence
  const salActifs = filtrerSalariesPourAnnee(salaries, annee)
  const ubRQTH = calculerUBRQTHPourAnnee(salaries, annee)
  const ubStagiaires = stagiaires
  const ubTotales = ubRQTH + ubStagiaires
  const quotaTheorique = effectifTotal * 0.06
  const deficit = Math.max(0, quotaTheorique - ubTotales)
  const coefficient = getCoefficientContribution(effectifTotal)
  const contributionBrute = deficit * coefficient * smicRef
  const tauxActuel = effectifTotal > 0 ? (ubTotales / effectifTotal) * 100 : 0
  const plafondDeductionESAT = contributionBrute * (tauxActuel >= 3 ? 0.75 : 0.5)
  const deductionESATAppliquee = Math.min(deductionESAT, plafondDeductionESAT)
  const deductionsTotales = deductionESATAppliquee + deductionAccords + deductionAutres
  const contributionNette = Math.max(0, contributionBrute - deductionsTotales)
  const conforme = ubTotales >= quotaTheorique

  // Mode d'acquittement DSN
  const modeAcquittement = (() => {
    if (conforme && deductionAccords === 0) return { code: '10', label: 'Emploi direct exclusif' }
    if (conforme && deductionAccords > 0) return { code: '30', label: 'Emploi direct + accord collectif' }
    if (!conforme && contributionNette === 0 && deductionAccords > 0) return { code: '30', label: 'Accord collectif agréé' }
    if (!conforme && contributionNette > 0 && deductionESATAppliquee > 0 && deductionAccords > 0) return { code: '80', label: 'Contribution + sous-traitance + accord' }
    if (!conforme && contributionNette > 0 && deductionESATAppliquee > 0) return { code: '60', label: 'Contribution + sous-traitance ESAT/EA' }
    if (!conforme && contributionNette > 0 && deductionAccords > 0) return { code: '90', label: 'Contribution + accord collectif' }
    if (!conforme && contributionNette === 0 && deductionESATAppliquee > 0) return { code: '60', label: 'Sous-traitance (contribution nulle)' }
    return { code: '50', label: 'Contribution pécuniaire uniquement' }
  })()

  // ── Onglet 1 : Récapitulatif DOETH ──
  const ws1 = wb.addWorksheet('Récapitulatif DOETH')
  ws1.columns = Array(4).fill(null).map(() => ({ width: 36 }))

  ws1.addRow([])
  const titleRow = ws1.addRow([`DÉCLARATION DOETH ${annee}, ${orgName}`])
  ws1.mergeCells('A2:D2'); titleRow.height = 36
  styleTitle(titleRow.getCell(1))

  const subRow = ws1.addRow([`À transmettre au gestionnaire de paie, intégration en DSN d'avril ${annee + 1}`])
  ws1.mergeCells('A3:D3'); subRow.height = 22
  styleSubtitle(subRow.getCell(1))

  ws1.addRow([])

  const warnRow = ws1.addRow(['⚠️  Document préparatoire. Ne remplace pas la déclaration officielle. Vérifiez chaque valeur avec votre logiciel de paie.'])
  ws1.mergeCells('A5:D5'); warnRow.height = 24
  warnRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } }
  warnRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF' + EXCEL_THEME.warning } }
  warnRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }

  ws1.addRow([])

  const addSection = (label: string, value: string, isBold = false, bgColor?: string, textColor?: string) => {
    const row = ws1.addRow([label, value])
    row.height = 22
    row.getCell(1).font = { name: 'Calibri', size: 11, bold: isBold, color: { argb: 'FF' + (textColor ?? EXCEL_THEME.textDark) } }
    row.getCell(2).font = { name: 'Calibri', size: 11, bold: isBold, color: { argb: 'FF' + (textColor ?? EXCEL_THEME.textDark) } }
    row.getCell(2).alignment = { horizontal: 'right' }
    if (bgColor) {
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } }
    }
    row.getCell(1).border = { bottom: { style: 'hair', color: { argb: 'FF' + EXCEL_THEME.borderColor } } }
    row.getCell(2).border = { bottom: { style: 'hair', color: { argb: 'FF' + EXCEL_THEME.borderColor } } }
    return row
  }

  addSection('EFFECTIFS', '', true, EXCEL_THEME.accent, EXCEL_THEME.primary)
  addSection(`Effectif d'assujettissement, ${annee}`, `${effectifTotal} salariés`)
  addSection('Quota légal BOETH (6%)', `${quotaTheorique.toFixed(2)} UB`)
  addSection(`Coefficient de contribution (effectif ${effectifTotal < 250 ? '< 250' : effectifTotal < 750 ? '250–749' : '≥ 750'})`, `${coefficient}`)
  addSection('SMIC horaire de référence', `${smicRef.toFixed(2)} €`)
  ws1.addRow([])

  addSection('UNITÉS BÉNÉFICIAIRES', '', true, EXCEL_THEME.accent, EXCEL_THEME.primary)
  addSection('UB salariés BOETH (proratisées par mois de présence)', ubRQTH.toFixed(4))
  Object.entries(LABEL_RECONNAISSANCE).forEach(([type, label]) => {
    const actifs = salActifs.filter(s => s.type_reconnaissance === type)
    const ub = actifs.reduce((sum, s) => sum + getUBProratee(s, annee), 0)
    if (actifs.length > 0) {
      const row = ws1.addRow([`   └ ${label.split(', ')[0]} (${actifs.length} sal.)`, ub.toFixed(4)])
      row.height = 18
      row.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
      row.getCell(2).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
      row.getCell(2).alignment = { horizontal: 'right' }
    }
  })
  addSection('UB stagiaires / alternants handicapés', ubStagiaires.toFixed(2))

  const totalUBRow = addSection('TOTAL UB BOETH', ubTotales.toFixed(4), true,
    conforme ? EXCEL_THEME.successLight : EXCEL_THEME.warningLight,
    conforme ? EXCEL_THEME.success : EXCEL_THEME.warning
  )
  totalUBRow.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF' + (conforme ? EXCEL_THEME.success : EXCEL_THEME.warning) } }
  totalUBRow.getCell(2).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF' + (conforme ? EXCEL_THEME.success : EXCEL_THEME.warning) } }

  ws1.addRow([])
  addSection('CONTRIBUTION', '', true, EXCEL_THEME.accent, EXCEL_THEME.primary)
  addSection('Taux d\'emploi BOETH', `${tauxActuel.toFixed(2)} %`)
  addSection('Déficit d\'UB', deficit.toFixed(4))
  addSection(`Contribution brute (${deficit.toFixed(4)} × ${coefficient} × ${smicRef} €)`, formatEuros(contributionBrute))
  addSection('(-) Déduction sous-traitance EA/ESAT/TIH (plafonnée)', `− ${formatEuros(deductionESATAppliquee)}`)
  addSection('(-) Accords de branche / d\'entreprise agréés', `− ${formatEuros(deductionAccords)}`)
  addSection('(-) Dépenses déductibles (plafond 10%)', `− ${formatEuros(deductionAutres)}`)
  ws1.addRow([])

  const netteRow = addSection('CONTRIBUTION NETTE À VERSER', formatEuros(contributionNette), true, EXCEL_THEME.primary, EXCEL_THEME.white)
  netteRow.height = 30
  netteRow.getCell(1).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
  netteRow.getCell(2).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
  ws1.addRow([])
  addSection(`Mode d'acquittement DSN (indicatif), code ${modeAcquittement.code}`, modeAcquittement.label)

  // ── Onglet 2 : Par établissement ──
  const siteRows = etablissements.map(e => {
    const sal = salaries.filter(s => s.establishment_id === e.id)
    const ubR = calculerUBRQTHPourAnnee(sal, annee)
    const quota = e.effectif_assujettissement * 0.06
    const taux = e.effectif_assujettissement > 0 ? (ubR / e.effectif_assujettissement) * 100 : 0
    const statut = taux >= 6 ? 'Conforme' : taux >= 3 ? 'En cours' : 'Non conforme'
    return {
      etablissement: e.name + (e.is_headquarters ? ' (Siège)' : ''),
      siret: e.siret ?? 'MANQUANT',
      effectif: e.effectif_assujettissement,
      ubRQTH: parseFloat(ubR.toFixed(4)),
      quota: parseFloat(quota.toFixed(2)),
      taux: parseFloat(taux.toFixed(2)),
      statut,
    }
  })

  const ws2 = createFormattedSheet(wb, 'Par établissement',
    `DOETH ${annee}, DÉTAIL PAR ÉTABLISSEMENT`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Établissement', key: 'etablissement', align: 'left' },
      { header: 'SIRET', key: 'siret', align: 'center', width: 18 },
      { header: 'Effectif', key: 'effectif', align: 'center', width: 12 },
      { header: 'UB RQTH (prorat.)', key: 'ubRQTH', align: 'right', width: 18 },
      { header: 'Quota (6%)', key: 'quota', align: 'right', width: 13 },
      { header: 'Taux BOETH (%)', key: 'taux', format: 'percent', align: 'center', width: 16 },
      { header: 'Statut', key: 'statut', align: 'center', width: 16 },
    ],
    siteRows,
    {
      etablissement: 'TOTAL',
      siret: '',
      effectif: effectifTotal,
      ubRQTH: parseFloat(ubRQTH.toFixed(4)),
      quota: parseFloat(quotaTheorique.toFixed(2)),
      taux: effectifTotal > 0 ? parseFloat(tauxActuel.toFixed(2)) : 0,
      statut: conforme ? 'Conforme' : 'Non conforme',
    }
  )

  ws2.eachRow((row, rowNumber) => {
    if (rowNumber <= 5) return
    const statutCell = row.getCell(7)
    const val = String(statutCell.value ?? '')
    if (val === 'Conforme') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.successLight } }
      statutCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.success } }
    } else if (val === 'En cours') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.warningLight } }
      statutCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.warning } }
    } else if (val === 'Non conforme') {
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.dangerLight } }
      statutCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.danger } }
    }
    // Flag SIRET manquant
    const siretCell = row.getCell(2)
    if (String(siretCell.value ?? '') === 'MANQUANT') {
      siretCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.danger } }
    }
  })

  // ── Onglet 3 : Salariés RQTH ──
  createFormattedSheet(wb, 'Salariés RQTH',
    `SALARIÉS BOETH ACTIFS EN ${annee}`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Prénom', key: 'prenom', align: 'left' },
      { header: 'Nom', key: 'nom', align: 'left' },
      { header: 'Matricule', key: 'matricule', align: 'center', width: 14 },
      { header: 'Établissement', key: 'etablissementName', align: 'left' },
      { header: 'Type de reconnaissance', key: 'typeLabel', align: 'left', width: 30 },
      { header: 'Début reconnaissance', key: 'date_debut', format: 'date', align: 'center', width: 20 },
      { header: 'Fin / Permanente', key: 'date_fin_label', align: 'center', width: 18 },
      { header: 'Mois présence', key: 'moisPresence', align: 'center', width: 14 },
      { header: '% Temps trav.', key: 'taux', align: 'center', width: 14 },
      { header: 'UB proratisée', key: 'ub', align: 'right', width: 14 },
    ],
    salActifs.map(s => ({
      prenom: s.prenom,
      nom: s.nom,
      matricule: s.matricule ?? '-',
      etablissementName: etablissements.find(e => e.id === s.establishment_id)?.name ?? '-',
      typeLabel: LABEL_RECONNAISSANCE[s.type_reconnaissance]?.split(', ')[0] ?? s.type_reconnaissance,
      date_debut: s.date_debut,
      date_fin_label: s.est_permanent ? 'Permanente' : (s.date_fin ?? '-'),
      moisPresence: getMoisPresencePourAnnee(s, annee),
      taux: `${s.taux_temps_travail ?? 100} %`,
      ub: parseFloat(getUBProratee(s, annee).toFixed(4)),
    })),
    {
      prenom: '', nom: '', matricule: '', etablissementName: '', typeLabel: '',
      date_debut: '', date_fin_label: `TOTAL, ${salActifs.length} BOETH`,
      moisPresence: '', taux: '', ub: parseFloat(ubRQTH.toFixed(4)),
    }
  )

  // ── Onglet 4 : Achats ESAT/EA ──
  const totalAchatsHT = achats.reduce((s, a) => s + a.montant_ht, 0)
  const estimDeductionESAT = estimerDeductionESAT(achats)
  createFormattedSheet(wb, 'Achats ESAT-EA',
    `ACHATS ESAT/EA | ${annee}`,
    ` | Exporté le ${TODAY}`,
    [
      { header: 'Fournisseur', key: 'fournisseur', align: 'left', width: 26 },
      { header: 'Établissement', key: 'etablissementName', align: 'left' },
      { header: 'Date facture', key: 'date_facture', format: 'date', align: 'center', width: 14 },
      { header: 'Montant HT (€)', key: 'montant_ht', format: 'currency', align: 'right' },
      { header: 'Déduction estimée 30% (€)', key: 'deduction_estimee', format: 'currency', align: 'right', width: 24 },
    ],
    achats.map(a => ({
      fournisseur: a.fournisseur,
      etablissementName: etablissements.find(e => e.id === a.establishment_id)?.name ?? '-',
      date_facture: a.date_facture,
      montant_ht: a.montant_ht,
      deduction_estimee: parseFloat((a.montant_ht * 0.3).toFixed(2)),
    })),
    {
      fournisseur: 'TOTAL',
      etablissementName: '',
      date_facture: '',
      montant_ht: totalAchatsHT,
      deduction_estimee: parseFloat(estimDeductionESAT.toFixed(2)),
    }
  )

  // ── Onglet 5 : Guide DSN ──
  const ws5 = wb.addWorksheet('Guide DSN')
  ws5.columns = [
    { width: 40 },
    { width: 26 },
    { width: 22 },
    { width: 56 },
  ]

  ws5.addRow([])
  const t5 = ws5.addRow([`GUIDE DE SAISIE DSN : DOETH ${annee}`])
  ws5.mergeCells('A2:D2'); t5.height = 36
  styleTitle(t5.getCell(1))

  const s5 = ws5.addRow([`À transmettre à votre gestionnaire de paie avant le 30 mars ${annee + 1}`])
  ws5.mergeCells('A3:D3'); s5.height = 22
  styleSubtitle(s5.getCell(1))

  ws5.addRow([])

  const addDSNSection = (title: string) => {
    const n = ws5.lastRow ? ws5.lastRow.number + 1 : 1
    const row = ws5.addRow([title, '', '', ''])
    ws5.mergeCells(`A${n}:D${n}`)
    row.height = 26
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.accent } }
    row.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.primary } }
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  }

  const addDSNRow = (champ: string, valeur: string, rubrique: string, instruction: string, highlight = false) => {
    const row = ws5.addRow([champ, valeur, rubrique, instruction])
    row.height = 22
    if (highlight) {
      ;[1, 2, 3, 4].forEach(c => {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.accent } }
        row.getCell(c).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.primary } }
      })
    } else {
      row.getCell(1).font = { name: 'Calibri', size: 11, color: { argb: 'FF' + EXCEL_THEME.textDark } }
      row.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1A1A2E' } }
      row.getCell(3).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
      row.getCell(4).font = { name: 'Calibri', size: 10, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
      row.getCell(4).alignment = { wrapText: true }
    }
    ;[1, 2, 3, 4].forEach(c => row.getCell(c).border = { bottom: { style: 'hair', color: { argb: 'FF' + EXCEL_THEME.borderColor } } })
    return row
  }

  // En-têtes colonnes
  const hRow = ws5.addRow(['Champ DOETH', 'Valeur calculée', 'Rubrique DSN (indicative)', 'Instructions pour le gestionnaire de paie'])
  hRow.height = 24
  ;[1, 2, 3, 4].forEach(c => {
    hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.primary } }
    hRow.getCell(c).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
    hRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  })

  // ── Calendrier ──
  addDSNSection('CALENDRIER ET PROCÉDURE')
  addDSNRow('Période couverte', `1er janv. ${annee}, 31 déc. ${annee}`, '-', `Données de l'exercice civil ${annee} uniquement`)
  addDSNRow('DSN à alimenter', `Paie d'avril ${annee + 1}`, '-', `Intégrer dans la DSN mensuelle de la paie d'avril ${annee + 1} (transmise début mai)`)
  addDSNRow('Date limite dépôt DSN', `5 mai ${annee + 1}`, '-', `15 mai ${annee + 1} si décalage de paie. En cas de retard : pénalité de 25% sur la contribution.`)
  addDSNRow('Bloc DSN concerné', 'S21.G00.83', '-', `"Versement libératoire OETH", présent dans la DSN V3. Chaque établissement peut avoir son propre bloc.`)
  ws5.addRow([])

  // ── Effectifs ──
  addDSNSection('EFFECTIFS')
  addDSNRow('Effectif global d\'assujettissement', `${effectifTotal} salariés`, 'S21.G00.83.001', `Saisir l'effectif ETP total de l'entreprise (somme de tous les établissements)`)
  addDSNRow('Quota légal BOETH (6%)', `${quotaTheorique.toFixed(2)} UB`, '-', `Calculé automatiquement : ${effectifTotal} × 6% = ${quotaTheorique.toFixed(2)} UB`)
  ws5.addRow([])

  // ── UB ──
  addDSNSection('UNITÉS BÉNÉFICIAIRES (EMPLOI DIRECT)')
  addDSNRow('Total UB emploi direct', ubTotales.toFixed(4), 'S21.G00.83.002', `UB BOETH proratisées par mois de présence : ${ubRQTH.toFixed(4)} UB (RQTH) + ${ubStagiaires} UB (stagiaires)`)
  addDSNRow('Nb de BOETH distincts employés', `${salActifs.length + stagiaires} personnes`, 'S21.G00.83.004', `Nombre de travailleurs handicapés différents ayant été présents en ${annee}`)
  addDSNRow('Taux d\'emploi BOETH', `${tauxActuel.toFixed(2)} %`, '-', `${ubTotales.toFixed(4)} / ${effectifTotal} × 100 = ${tauxActuel.toFixed(2)}%`)
  ws5.addRow([])

  // ── Contribution ──
  addDSNSection('CONTRIBUTION FINANCIÈRE')
  addDSNRow('Déficit d\'UB', deficit.toFixed(4), '-', `Max(0 ; ${quotaTheorique.toFixed(4)} − ${ubTotales.toFixed(4)}) = ${deficit.toFixed(4)} UB`)
  addDSNRow(`Contribution brute`, formatEuros(contributionBrute), 'S21.G00.83.003', `${deficit.toFixed(4)} × ${coefficient} × ${smicRef.toFixed(2)} € = ${formatEuros(contributionBrute)}`)
  addDSNRow('Déduction sous-traitance ESAT/EA (plafonnée)', `− ${formatEuros(deductionESATAppliquee)}`, 'S21.G00.83.xxx', `Montant de l'attestation ESAT/EA reçue avant le 31/01/${annee + 1}. Plafond : ${tauxActuel >= 3 ? '75' : '50'}% × ${formatEuros(contributionBrute)} = ${formatEuros(plafondDeductionESAT)}`)
  addDSNRow('Déduction accords collectifs agréés', `− ${formatEuros(deductionAccords)}`, 'S21.G00.83.xxx', `Accords agréés par DREETS uniquement. Joindre le numéro d'agrément au dossier.`)
  addDSNRow('Déduction dépenses déductibles', `− ${formatEuros(deductionAutres)}`, 'S21.G00.83.xxx', `Actions formation, adaptation poste, maintien emploi BOETH. Plafond : 10% de la contribution brute = ${formatEuros(contributionBrute * 0.1)}`)
  const netteRow5 = addDSNRow('CONTRIBUTION NETTE À VERSER', formatEuros(contributionNette), 'S21.G00.83.005', `Montant télé-réglé à l'AGEFIPH via la DSN. Paiement joint au dépôt DSN.`, true)
  netteRow5.height = 28
  ws5.addRow([])

  // ── Mode d'acquittement ──
  addDSNSection('MODE D\'ACQUITTEMENT')
  addDSNRow('Code mode d\'acquittement (indicatif)', modeAcquittement.code, 'S21.G00.83.001', modeAcquittement.label + ', À vérifier avec votre logiciel de paie (les codes varient selon les éditeurs).')
  ws5.addRow([])

  // ── Points de vigilance ──
  addDSNSection('POINTS DE VIGILANCE')
  const vigRows = [
    ['SIRET par établissement', 'Obligatoire dans la DSN', '-', 'Vérifier que chaque établissement a son SIRET dans le bloc S21.G00.83. SIRET manquants : ' + (etablissements.filter(e => !e.siret).map(e => e.name).join(', ') || 'aucun')],
    ['Attestations ESAT/EA', 'À conserver', '-', `Conserver toutes les attestations reçues des EA/ESAT jusqu'au contrôle AGEFIPH (délai de 3 ans). Montant retenu : ${formatEuros(deductionESATAppliquee)}`],
    ['UB proratisées', 'Méthode appliquée', '-', 'Les UB sont calculées au prorata des mois de présence dans l\'année (nb mois / 12 × taux temps travail). Voir onglet "Salariés RQTH" pour le détail.'],
    ['Sanctions', 'Pénalité 25%', '-', 'En cas de non-déclaration ou déclaration tardive, la contribution est majorée de 25%. En cas de fausse déclaration : redressement + pénalités.'],
    ['AGEFIPH contact', 'Accompagnement', '-', 'Pour toute question : agefiph.fr ou votre délégué régional AGEFIPH. L\'AGEFIPH propose aussi des aides pour l\'emploi des BOETH.'],
  ]
  vigRows.forEach(([champ, valeur, rubrique, instruction]) => addDSNRow(champ, valeur, rubrique, instruction))

  // Activer les retours à la ligne (colonne Instructions)
  ws5.getColumn(4).alignment = { wrapText: true, vertical: 'top' }
  ws5.getColumn(1).alignment = { vertical: 'middle' }
  ws5.getColumn(2).alignment = { vertical: 'middle', horizontal: 'center' }
  ws5.getColumn(3).alignment = { vertical: 'middle', horizontal: 'center' }
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function styleTitle(cell: ExcelJS.Cell) {
  cell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.primary } }
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
}

function styleSubtitle(cell: ExcelJS.Cell) {
  cell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
}

function formatEuros(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
}

function getStatut(dateFin: string | null, estPermanent: boolean): 'actif' | 'expire_bientot' | 'expire' {
  if (estPermanent || !dateFin) return 'actif'
  const fin = new Date(dateFin)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((fin.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'expire'
  if (diff <= 90) return 'expire_bientot'
  return 'actif'
}
