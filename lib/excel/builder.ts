import ExcelJS from 'exceljs'
import { EXCEL_THEME } from './theme'

export interface SheetColumn {
  header: string
  key: string
  width?: number
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date'
  align?: 'left' | 'center' | 'right'
}

export function createFormattedSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  title: string,
  subtitle: string,
  columns: SheetColumn[],
  rows: Record<string, unknown>[],
  totalRow?: Record<string, unknown>
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet(sheetName)
  const colCount = columns.length

  ws.columns = columns.map(col => ({ key: col.key, width: col.width ?? 18 }))

  // Ligne 1 : espace respirant
  ws.addRow([])

  // Ligne 2 : titre fusionné
  const titleRow = ws.addRow([title])
  ws.mergeCells(`A2:${colLetter(colCount)}2`)
  titleRow.height = 36
  const titleCell = titleRow.getCell(1)
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.primary } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Ligne 3 : sous-titre fusionné
  const subRow = ws.addRow([subtitle])
  ws.mergeCells(`A3:${colLetter(colCount)}3`)
  subRow.height = 22
  const subCell = subRow.getCell(1)
  subCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF' + EXCEL_THEME.textMuted } }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Ligne 4 : séparateur
  ws.addRow([])

  // Ligne 5 : en-têtes
  const headerRow = ws.addRow(columns.map(c => c.header))
  headerRow.height = 28
  headerRow.eachCell(cell => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.secondary } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF' + EXCEL_THEME.primary } } }
  })

  // Données
  rows.forEach((row, index) => {
    const dataRow = ws.addRow(columns.map(col => formatCellValue(row[col.key], col.format)))
    dataRow.height = 20
    const isAlternate = index % 2 === 1
    dataRow.eachCell((cell, colIndex) => {
      const col = columns[colIndex - 1]
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF' + EXCEL_THEME.textDark } }
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF' + (isAlternate ? EXCEL_THEME.accent : EXCEL_THEME.white) },
      }
      cell.alignment = { vertical: 'middle', horizontal: col?.align ?? 'left' }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FF' + EXCEL_THEME.borderColor } } }
      if (col?.format === 'currency') cell.numFmt = '#,##0.00 "€"'
      if (col?.format === 'percent') cell.numFmt = '0.00"%"'
      if (col?.format === 'date') cell.numFmt = 'dd/mm/yyyy'
    })
  })

  // Ligne total
  if (totalRow) {
    ws.addRow([])
    const totRow = ws.addRow(columns.map(col => formatCellValue(totalRow[col.key], col.format)))
    totRow.height = 24
    totRow.eachCell((cell, colIndex) => {
      const col = columns[colIndex - 1]
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + EXCEL_THEME.primary } }
      cell.alignment = { vertical: 'middle', horizontal: col?.align ?? 'left' }
      if (col?.format === 'currency') cell.numFmt = '#,##0.00 "€"'
      if (col?.format === 'percent') cell.numFmt = '0.00"%"'
    })
  }

  // Auto-largeur intelligente
  columns.forEach((col, i) => {
    const colObj = ws.getColumn(i + 1)
    const maxLen = Math.max(
      col.header.length,
      ...rows.map(r => String(r[col.key] ?? '').length)
    )
    colObj.width = Math.min(Math.max(maxLen + 4, col.width ?? 12), 40)
  })

  return ws
}

export function addKpiRow(
  workbook: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  kpis: { label: string; value: string; color?: string }[],
  startRow: number,
  colCount: number
) {
  const colWidth = Math.floor(colCount / kpis.length)
  kpis.forEach((kpi, i) => {
    const col = i * colWidth + 1
    const endCol = i === kpis.length - 1 ? colCount : col + colWidth - 1
    ws.mergeCells(startRow, col, startRow + 1, endCol)
    const cell = ws.getCell(startRow, col)
    cell.value = `${kpi.label}\n${kpi.value}`
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF' + EXCEL_THEME.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + (kpi.color ?? EXCEL_THEME.secondary) } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    ws.getRow(startRow).height = 40
  })
}

export async function generateExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer)
}

function colLetter(n: number): string {
  if (n <= 26) return String.fromCharCode(64 + n)
  return String.fromCharCode(64 + Math.floor((n - 1) / 26)) + String.fromCharCode(65 + ((n - 1) % 26))
}

function formatCellValue(value: unknown, format?: string): unknown {
  if (value === null || value === undefined) return ''
  if (format === 'currency') return typeof value === 'number' ? value : parseFloat(String(value))
  if (format === 'date' && typeof value === 'string') return value ? new Date(value) : ''
  return value
}
