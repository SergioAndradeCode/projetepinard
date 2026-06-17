import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'

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

const COLOR_PRIMARY = rgb(0.118, 0.290, 0.549) // #1E4A8C
const COLOR_DARK    = rgb(0.102, 0.102, 0.180) // #1A1A2E
const COLOR_GRAY    = rgb(0.420, 0.447, 0.502) // #6B7280
const COLOR_LIGHT   = rgb(0.886, 0.925, 0.980) // #EBF2FA
const COLOR_BLACK   = rgb(0, 0, 0)
const COLOR_WHITE   = rgb(1, 1, 1)

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 56
const USABLE_W = PAGE_W - MARGIN * 2

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function drawLine(page: PDFPage, y: number, color = COLOR_LIGHT) {
  page.drawLine({
    start: { x: MARGIN, y },
    end:   { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color,
  })
}

function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}

function text(
  page: PDFPage,
  content: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb> = COLOR_DARK,
  align: 'left' | 'right' | 'center' = 'left',
  maxWidth?: number,
) {
  let dx = x
  if (align !== 'left') {
    const w = font.widthOfTextAtSize(content, size)
    if (align === 'right') dx = x - w
    if (align === 'center') dx = x - w / 2
  }
  if (maxWidth) {
    // Truncate if too long
    let str = content
    while (str.length > 0 && font.widthOfTextAtSize(str, size) > maxWidth) str = str.slice(0, -1)
    content = str
  }
  page.drawText(content, { x: dx, y, font, size, color })
}

export async function generateInvoice(data: InvoiceData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const companyName = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'
  const companyAddress = process.env.TALENTH_ADDRESS ?? 'France'
  const companySiret = process.env.TALENTH_SIRET ?? ''
  const companyEmail = process.env.TALENTH_EMAIL_CONTACT ?? 'contact@talenth.fr'
  const iban = process.env.TALENTH_IBAN ?? 'À RENSEIGNER'
  const bic  = process.env.TALENTH_BIC  ?? 'À RENSEIGNER'
  const bankHolder = process.env.TALENTH_BANK_HOLDER ?? companyName

  // ── HEADER ───────────────────────────────────────────────────────────────
  const headerH = 80
  drawRect(page, 0, PAGE_H - headerH, PAGE_W, headerH, COLOR_PRIMARY)

  text(page, companyName, MARGIN, PAGE_H - 34, fontBold, 22, COLOR_WHITE)
  text(page, 'Pilotage OETH simplifié', MARGIN, PAGE_H - 52, fontRegular, 10, rgb(0.75, 0.85, 0.95))
  text(page, companyAddress, PAGE_W - MARGIN, PAGE_H - 30, fontRegular, 9, rgb(0.75, 0.85, 0.95), 'right')
  if (companySiret) {
    text(page, `SIRET : ${companySiret}`, PAGE_W - MARGIN, PAGE_H - 42, fontRegular, 9, rgb(0.75, 0.85, 0.95), 'right')
  }
  text(page, companyEmail, PAGE_W - MARGIN, PAGE_H - 54, fontRegular, 9, rgb(0.75, 0.85, 0.95), 'right')

  // ── INVOICE TITLE BAND ───────────────────────────────────────────────────
  let y = PAGE_H - headerH - 36

  text(page, 'FACTURE', MARGIN, y, fontBold, 20, COLOR_PRIMARY)

  const rightColX = PAGE_W - MARGIN - 180
  const labelX    = rightColX
  const valueX    = PAGE_W - MARGIN

  const rows: [string, string][] = [
    ['N° de facture',    data.invoiceNumber],
    ['Date d\'émission', fmtDate(data.issueDate)],
    ['Date d\'échéance', fmtDate(data.dueDate)],
  ]

  let rowY = y + 4
  for (const [label, value] of rows) {
    text(page, label, labelX, rowY, fontRegular, 9, COLOR_GRAY)
    text(page, value, valueX, rowY, fontBold, 9, COLOR_DARK, 'right')
    rowY -= 14
  }

  y -= 16
  drawLine(page, y)
  y -= 22

  // ── ADDRESSES ────────────────────────────────────────────────────────────
  const col2X = MARGIN + USABLE_W / 2 + 10

  text(page, 'ÉMETTEUR', MARGIN, y, fontBold, 8, COLOR_GRAY)
  text(page, 'FACTURER À', col2X, y, fontBold, 8, COLOR_GRAY)
  y -= 16

  text(page, companyName, MARGIN, y, fontBold, 10, COLOR_DARK)
  text(page, data.companyName, col2X, y, fontBold, 10, COLOR_DARK)
  y -= 13

  const emitterLines = companyAddress.split('\n')
  for (const line of emitterLines) {
    text(page, line, MARGIN, y, fontRegular, 9, COLOR_DARK)
    y -= 12
  }

  let clientY = y + emitterLines.length * 12 - 13
  text(page, data.billingAddress, col2X, clientY, fontRegular, 9, COLOR_DARK); clientY -= 12
  text(page, `${data.postalCode} ${data.city}`, col2X, clientY, fontRegular, 9, COLOR_DARK); clientY -= 12
  text(page, data.country, col2X, clientY, fontRegular, 9, COLOR_DARK); clientY -= 12
  text(page, `SIRET : ${data.siret}`, col2X, clientY, fontRegular, 9, COLOR_DARK)

  y = Math.min(y, clientY) - 20
  drawLine(page, y)
  y -= 20

  // ── TABLE HEADER ─────────────────────────────────────────────────────────
  const colDesc   = MARGIN
  const colQty    = MARGIN + USABLE_W * 0.58
  const colUnitHt = MARGIN + USABLE_W * 0.70
  const colTotal  = PAGE_W - MARGIN

  drawRect(page, MARGIN - 4, y - 4, USABLE_W + 8, 20, COLOR_LIGHT)

  text(page, 'DÉSIGNATION',  colDesc,   y + 5, fontBold, 8, COLOR_PRIMARY)
  text(page, 'QTÉ',          colQty,    y + 5, fontBold, 8, COLOR_PRIMARY)
  text(page, 'PU HT',        colUnitHt, y + 5, fontBold, 8, COLOR_PRIMARY)
  text(page, 'TOTAL HT',     colTotal,  y + 5, fontBold, 8, COLOR_PRIMARY, 'right')

  y -= 22

  // ── TABLE ROW ─────────────────────────────────────────────────────────────
  const designation = `Abonnement Talenth — Plan ${data.planName} (${data.billingCycleLabel})`
  const subline     = 'Accès SaaS pilotage OETH'

  text(page, designation, colDesc, y + 2, fontBold, 9, COLOR_DARK, 'left', colQty - colDesc - 10)
  text(page, subline,     colDesc, y - 9,  fontRegular, 8, COLOR_GRAY)
  text(page, '1',         colQty,    y + 2, fontRegular, 9, COLOR_DARK)
  text(page, fmt(data.amountHt), colUnitHt, y + 2, fontRegular, 9, COLOR_DARK)
  text(page, fmt(data.amountHt), colTotal,  y + 2, fontBold,    9, COLOR_DARK, 'right')

  y -= 30
  drawLine(page, y)
  y -= 18

  // ── TOTALS ───────────────────────────────────────────────────────────────
  const totalLabelX = MARGIN + USABLE_W * 0.60
  const totalValueX = PAGE_W - MARGIN

  const totals: [string, string, boolean][] = [
    ['Total HT',  fmt(data.amountHt),  false],
    ['TVA 20 %',  fmt(data.amountTva), false],
    ['Total TTC', fmt(data.amountTtc), true],
  ]

  for (const [label, value, isTotal] of totals) {
    if (isTotal) {
      drawRect(page, totalLabelX - 8, y - 5, USABLE_W - (totalLabelX - MARGIN) + 8, 20, COLOR_PRIMARY)
      text(page, label, totalLabelX, y + 5, fontBold, 10, COLOR_WHITE)
      text(page, value, totalValueX, y + 5, fontBold, 12, COLOR_WHITE, 'right')
    } else {
      text(page, label, totalLabelX, y + 5, fontRegular, 9, COLOR_GRAY)
      text(page, value, totalValueX, y + 5, fontRegular, 9, COLOR_DARK, 'right')
    }
    y -= 20
  }

  y -= 20
  drawLine(page, y)
  y -= 22

  // ── PAYMENT INSTRUCTIONS ─────────────────────────────────────────────────
  drawRect(page, MARGIN - 8, y - 4, USABLE_W + 16, 16, COLOR_LIGHT)
  text(page, 'MODALITÉS DE PAIEMENT', MARGIN, y + 6, fontBold, 9, COLOR_PRIMARY)
  y -= 22

  const payLines: [string, string][] = [
    ['Titulaire',   bankHolder],
    ['IBAN',        iban],
    ['BIC',         bic],
    ['Référence',   data.invoiceNumber],
    ['Échéance',    `${fmtDate(data.dueDate)} (30 jours net)`],
  ]

  for (const [label, value] of payLines) {
    text(page, `${label} :`, MARGIN + 2, y, fontBold, 9, COLOR_DARK)
    text(page, value, MARGIN + 80, y, fontRegular, 9, COLOR_DARK)
    y -= 14
  }

  y -= 10
  drawLine(page, y, rgb(0.88, 0.88, 0.88))
  y -= 16

  // ── LEGAL NOTICE ─────────────────────────────────────────────────────────
  const legal1 = 'Conformément à l\'art. L441-10 du Code de commerce, tout retard entraîne des pénalités au taux légal + indemnité forfaitaire de 40 €.'
  const legal2 = 'Paiement par virement bancaire uniquement. Pas d\'escompte pour paiement anticipé.'

  text(page, legal1, MARGIN, y, fontRegular, 7, COLOR_GRAY, 'left', USABLE_W)
  y -= 11
  text(page, legal2, MARGIN, y, fontRegular, 7, COLOR_GRAY, 'left', USABLE_W)

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = 24
  drawRect(page, 0, 0, PAGE_W, footerY + 4, COLOR_LIGHT)
  text(
    page,
    `${companyName} · ${companyAddress} · ${companyEmail}`,
    PAGE_W / 2, footerY - 2,
    fontRegular, 7, COLOR_GRAY, 'center',
  )

  return doc.save()
}
