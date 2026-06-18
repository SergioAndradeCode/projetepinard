import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib'
import path from 'path'
import fs from 'fs'

export interface InvoiceData {
  invoiceNumber:        string
  issueDate:            Date
  dueDate:              Date
  companyName:          string
  siret:                string
  billingAddress:       string
  postalCode:           string
  city:                 string
  country:              string
  planName:             string
  billingCycleLabel:    string
  amountHt:             number
  amountTva:            number
  amountTtc:            number
}

// ── Palette Talenth ───────────────────────────────────────────────────────
const C_BLUE       = rgb(0.118, 0.290, 0.549)  // #1E4A8C
const C_BLUE_DARK  = rgb(0.059, 0.122, 0.235)  // #0F1F3C
const C_AMBER      = rgb(0.961, 0.620, 0.043)  // #F59E0B
const C_DARK       = rgb(0.102, 0.102, 0.180)  // #1A1A2E
const C_GRAY       = rgb(0.420, 0.447, 0.502)  // #6B7280
const C_LIGHT_BLUE = rgb(0.922, 0.949, 0.980)  // #EBF2FA
const C_WHITE      = rgb(1, 1, 1)
const C_BORDER     = rgb(0.886, 0.910, 0.941)  // #E2E8F0


const PAGE_W = 595.28
const PAGE_H = 841.89
const M      = 52   // marge
const W      = PAGE_W - M * 2

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = C_BORDER, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })
}

function txt(
  page: PDFPage,
  content: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb> = C_DARK,
  align: 'left' | 'right' | 'center' = 'left',
  maxW?: number,
) {
  if (!content) return
  let str = content
  if (maxW) {
    while (str.length > 1 && font.widthOfTextAtSize(str, size) > maxW) str = str.slice(0, -1)
    if (str !== content) str = str.slice(0, -1) + '…'
  }
  const w = font.widthOfTextAtSize(str, size)
  let dx = x
  if (align === 'right')  dx = x - w
  if (align === 'center') dx = x - w / 2
  page.drawText(str, { x: dx, y, font, size, color })
}

export async function generateInvoice(data: InvoiceData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const emitterName    = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'
  const emitterAddress = process.env.TALENTH_ADDRESS      ?? 'France'
  const emitterSiret   = process.env.TALENTH_SIRET        ?? ''
  const emitterEmail   = process.env.TALENTH_EMAIL_CONTACT ?? 'talenthsupport@gmail.com'
  const iban           = process.env.TALENTH_IBAN         ?? 'À RENSEIGNER'
  const bic            = process.env.TALENTH_BIC          ?? 'À RENSEIGNER'
  const bankHolder     = process.env.TALENTH_BANK_HOLDER  ?? emitterName

  // ── Logo ─────────────────────────────────────────────────────────────────
  let logo: PDFImage | null = null
  try {
    const logoPath  = path.join(process.cwd(), 'public', 'logo.png')
    const logoBytes = fs.readFileSync(logoPath)
    logo = await doc.embedPng(logoBytes)
  } catch {
    // Logo non disponible, on continue sans
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEADER — bande bleue foncée
  // ════════════════════════════════════════════════════════════════════════
  const headerH = 90
  drawRect(page, 0, PAGE_H - headerH, PAGE_W, headerH, C_BLUE_DARK)

  // Liseré amber en bas du header
  drawRect(page, 0, PAGE_H - headerH, PAGE_W, 3, C_AMBER)

  // Logo
  const logoSize = 48
  const logoX    = M
  const logoY    = PAGE_H - headerH + (headerH - logoSize) / 2
  if (logo) {
    page.drawImage(logo, { x: logoX, y: logoY, width: logoSize, height: logoSize })
  }

  // Nom entreprise
  const nameX = logo ? logoX + logoSize + 12 : logoX
  txt(page, emitterName, nameX, PAGE_H - 38, bold, 20, C_WHITE)
  txt(page, 'Pilotage OETH simplifié', nameX, PAGE_H - 54, regular, 9, rgb(0.65, 0.78, 0.92))

  // Infos émetteur (droite)
  const rightX = PAGE_W - M
  txt(page, emitterEmail,   rightX, PAGE_H - 32, regular, 8, rgb(0.75, 0.86, 0.95), 'right')
  txt(page, emitterAddress, rightX, PAGE_H - 44, regular, 8, rgb(0.75, 0.86, 0.95), 'right')
  if (emitterSiret) {
    txt(page, `SIRET : ${emitterSiret}`, rightX, PAGE_H - 56, regular, 8, rgb(0.75, 0.86, 0.95), 'right')
  }

  // ════════════════════════════════════════════════════════════════════════
  // BLOC FACTURE — titre + meta
  // ════════════════════════════════════════════════════════════════════════
  let y = PAGE_H - headerH - 30

  // Titre "FACTURE"
  txt(page, 'FACTURE', M, y, bold, 22, C_BLUE)

  // Numéro + dates (colonne droite)
  const metaLabelX = PAGE_W - M - 170
  const metaValueX = PAGE_W - M

  const metaRows: [string, string][] = [
    ['N°', data.invoiceNumber],
    ['Émise le', fmtDate(data.issueDate)],
    ['Échéance', fmtDate(data.dueDate)],
  ]
  let metaY = y + 6
  for (const [label, value] of metaRows) {
    txt(page, label,  metaLabelX, metaY, regular, 8, C_GRAY)
    txt(page, value,  metaValueX, metaY, bold,    9, C_DARK, 'right')
    metaY -= 14
  }

  y -= 14
  drawLine(page, M, y, PAGE_W - M, y)
  y -= 22

  // ════════════════════════════════════════════════════════════════════════
  // ADRESSES — 2 colonnes
  // ════════════════════════════════════════════════════════════════════════
  const col2X = M + W / 2 + 12

  // Labels colonnes
  txt(page, 'DE',           M,     y, bold, 7, C_BLUE)
  txt(page, 'FACTURER À',   col2X, y, bold, 7, C_BLUE)
  y -= 14

  // Émetteur (colonne gauche)
  txt(page, emitterName,    M, y,      bold,    10, C_DARK)
  txt(page, data.companyName, col2X, y, bold,   10, C_DARK)
  y -= 13

  const emitterLines = emitterAddress.split(',').map(s => s.trim()).filter(Boolean)
  let leftY  = y
  let rightY = y

  for (const line of emitterLines) {
    txt(page, line, M, leftY, regular, 9, C_DARK)
    leftY -= 12
  }
  if (emitterSiret) {
    txt(page, `SIRET : ${emitterSiret}`, M, leftY, regular, 8, C_GRAY)
    leftY -= 12
  }

  txt(page, data.billingAddress, col2X, rightY, regular, 9, C_DARK); rightY -= 12
  txt(page, `${data.postalCode} ${data.city}`, col2X, rightY, regular, 9, C_DARK); rightY -= 12
  txt(page, data.country, col2X, rightY, regular, 9, C_DARK); rightY -= 12
  txt(page, `SIRET : ${data.siret}`, col2X, rightY, regular, 8, C_GRAY)

  y = Math.min(leftY, rightY) - 20
  drawLine(page, M, y, PAGE_W - M, y)
  y -= 22

  // ════════════════════════════════════════════════════════════════════════
  // TABLEAU — en-tête
  // ════════════════════════════════════════════════════════════════════════
  const colDesc  = M
  const colQty   = M + W * 0.60
  const colPu    = M + W * 0.73
  const colTotal = PAGE_W - M

  // Fond en-tête tableau
  drawRect(page, M - 6, y - 6, W + 12, 22, C_LIGHT_BLUE)

  txt(page, 'DÉSIGNATION', colDesc,  y + 6, bold, 8, C_BLUE)
  txt(page, 'QTÉ',         colQty,   y + 6, bold, 8, C_BLUE)
  txt(page, 'PU HT',       colPu,    y + 6, bold, 8, C_BLUE)
  txt(page, 'TOTAL HT',    colTotal, y + 6, bold, 8, C_BLUE, 'right')

  y -= 22

  // ── Ligne produit ────────────────────────────────────────────────────────
  drawRect(page, M - 6, y - 14, W + 12, 32, C_WHITE)

  const designation = `Abonnement Talenth - Plan ${data.planName}`
  const subline     = data.billingCycleLabel + ' · Accès SaaS pilotage OETH'

  txt(page, designation, colDesc, y + 6,  bold,    9, C_DARK, 'left', colQty - colDesc - 10)
  txt(page, subline,     colDesc, y - 5,  regular, 8, C_GRAY, 'left', colQty - colDesc - 10)
  txt(page, '1',         colQty,  y + 6,  regular, 9, C_DARK)
  txt(page, fmt(data.amountHt), colPu,    y + 6, regular, 9, C_DARK)
  txt(page, fmt(data.amountHt), colTotal, y + 6, bold,    9, C_DARK, 'right')

  y -= 28
  drawLine(page, M - 6, y, PAGE_W - M + 6, y, C_BORDER)
  y -= 18

  // ════════════════════════════════════════════════════════════════════════
  // TOTAUX
  // ════════════════════════════════════════════════════════════════════════
  const totLabelX = M + W * 0.58
  const totValueX = PAGE_W - M

  // Total HT
  txt(page, 'Total HT',  totLabelX, y, regular, 9, C_GRAY)
  txt(page, fmt(data.amountHt), totValueX, y, regular, 9, C_DARK, 'right')
  y -= 16

  // TVA
  txt(page, 'TVA 20 %', totLabelX, y, regular, 9, C_GRAY)
  txt(page, fmt(data.amountTva), totValueX, y, regular, 9, C_DARK, 'right')
  y -= 10

  drawLine(page, totLabelX, y, PAGE_W - M, y, C_BORDER)
  y -= 14

  // Total TTC — bande amber
  const ttcBandH = 28
  drawRect(page, totLabelX - 10, y - 6, PAGE_W - M - totLabelX + 16, ttcBandH, C_AMBER)
  txt(page, 'TOTAL TTC', totLabelX, y + 8, bold, 10, C_WHITE)
  txt(page, fmt(data.amountTtc), totValueX, y + 8, bold, 13, C_WHITE, 'right')

  y -= ttcBandH + 16

  // ════════════════════════════════════════════════════════════════════════
  // MODALITÉS DE PAIEMENT
  // ════════════════════════════════════════════════════════════════════════
  y -= 10
  drawRect(page, M - 6, y - 6, W + 12, 18, C_LIGHT_BLUE)
  txt(page, 'MODALITÉS DE PAIEMENT', M, y + 6, bold, 8, C_BLUE)
  y -= 22

  const payRows: [string, string][] = [
    ['Titulaire',   bankHolder],
    ['IBAN',        iban],
    ['BIC / SWIFT', bic],
    ['Référence',   `${data.invoiceNumber} (à indiquer obligatoirement)`],
    ['Délai',       '30 jours nets à compter de la date de facturation'],
  ]

  for (const [label, value] of payRows) {
    // Fond alterné
    const rowH = 14
    txt(page, label + ' :', M, y, bold, 8, C_DARK)
    txt(page, value, M + 90, y, regular, 8, C_DARK, 'left', PAGE_W - M - (M + 90) - 4)
    y -= rowH
  }

  // ════════════════════════════════════════════════════════════════════════
  // MENTIONS LÉGALES
  // ════════════════════════════════════════════════════════════════════════
  y -= 16
  drawLine(page, M, y, PAGE_W - M, y, C_BORDER)
  y -= 14

  const legal = [
    'Conformément à l\'art. L441-10 du Code de commerce, tout retard de paiement entraîne des pénalités de retard au taux légal en vigueur,',
    'ainsi qu\'une indemnité forfaitaire de recouvrement de 40 €. Pas d\'escompte pour paiement anticipé.',
  ]
  for (const line of legal) {
    txt(page, line, M, y, regular, 6.5, C_GRAY, 'left', W)
    y -= 10
  }

  // ════════════════════════════════════════════════════════════════════════
  // PIED DE PAGE
  // ════════════════════════════════════════════════════════════════════════
  const footerH = 32
  drawRect(page, 0, 0, PAGE_W, footerH, C_BLUE_DARK)
  drawRect(page, 0, footerH, PAGE_W, 2, C_AMBER)

  // Logo miniature dans le footer
  if (logo) {
    page.drawImage(logo, { x: M, y: 7, width: 18, height: 18 })
  }
  const footerTextX = logo ? M + 24 : M
  txt(page, `${emitterName} · ${emitterAddress} · ${emitterEmail}`, footerTextX, 13, regular, 7, rgb(0.65, 0.78, 0.92))
  txt(page, data.invoiceNumber, PAGE_W - M, 13, bold, 7, C_AMBER, 'right')

  return doc.save()
}
