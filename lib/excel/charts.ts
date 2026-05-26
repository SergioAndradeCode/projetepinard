import { createCanvas, type Canvas } from '@napi-rs/canvas'

// ─── Palette ─────────────────────────────────────────────────────────────────
const PALETTE = ['#1E4A8C', '#2E75B6', '#3B9CD9', '#2E7D32', '#BF5A00', '#7C3AED', '#6B7280']
const GRID = '#E8EDF2'
const TEXT_DARK = '#1A1A2E'
const TEXT_MUTED = '#6B7280'
const BG = '#FFFFFF'
const FONT = 'sans-serif'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function euros(v: number): string {
  if (v === 0) return '0 €'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M €`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k €`
  return `${v.toFixed(0)} €`
}

function pct(v: number): string {
  return `${v.toFixed(0)} %`
}

function setupCanvas(w: number, h: number): { canvas: Canvas; ctx: CanvasRenderingContext2D } {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
  return { canvas, ctx }
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function truncateLabel(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 3 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

// ─── 1. Donut — Répartition par catégorie ────────────────────────────────────

export function drawDonutCategories(
  data: { name: string; value: number }[]
): Buffer {
  const W = 800, H = 420
  const { canvas, ctx } = setupCanvas(W, H)

  // Titre
  ctx.font = `bold 18px ${FONT}`
  ctx.fillStyle = TEXT_DARK
  ctx.fillText('Répartition par catégorie', 32, 36)

  if (data.length === 0) {
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText('Aucune dépense', W / 2, H / 2)
    return canvas.toBuffer('image/png')
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = 220, cy = 220, outerR = 150, innerR = 72

  // Donut
  let startAngle = -Math.PI / 2
  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice)
    ctx.closePath()
    ctx.fillStyle = PALETTE[i % PALETTE.length]
    ctx.fill()
    ctx.strokeStyle = BG
    ctx.lineWidth = 2
    ctx.stroke()
    startAngle += slice
  })

  // Trou central
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.fillStyle = BG
  ctx.fill()

  // Total au centre
  ctx.font = `bold 22px ${FONT}`
  ctx.fillStyle = TEXT_DARK
  ctx.textAlign = 'center'
  ctx.fillText(euros(total), cx, cy - 6)
  ctx.font = `12px ${FONT}`
  ctx.fillStyle = TEXT_MUTED
  ctx.fillText('total', cx, cy + 16)
  ctx.textAlign = 'left'

  // Légende à droite
  const legendX = 420, legendStartY = 60
  const rowH = 44, swatchSize = 14

  data.forEach((d, i) => {
    const y = legendStartY + i * rowH
    const color = PALETTE[i % PALETTE.length]

    // Swatch
    drawRoundRect(ctx, legendX, y + 2, swatchSize, swatchSize, 3, color)

    // Nom
    ctx.font = `13px ${FONT}`
    ctx.fillStyle = TEXT_DARK
    const label = truncateLabel(ctx, d.name, 240)
    ctx.fillText(label, legendX + swatchSize + 10, y + 13)

    // Montant
    ctx.font = `bold 15px ${FONT}`
    ctx.fillStyle = TEXT_DARK
    ctx.fillText(euros(d.value), legendX + swatchSize + 10, y + 30)

    // Pourcentage
    ctx.font = `12px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    const pctLabel = pct((d.value / total) * 100)
    const mw = ctx.measureText(label).width
    ctx.fillText(pctLabel, legendX + swatchSize + 10 + mw + 8, y + 13)
  })

  return canvas.toBuffer('image/png')
}

// ─── 2. Bar groupé — Budget vs Dépenses par site ─────────────────────────────

export function drawBarBudgetSites(
  data: { name: string; budget: number; depenses: number }[]
): Buffer {
  const W = 800, H = 420
  const { canvas, ctx } = setupCanvas(W, H)

  ctx.font = `bold 18px ${FONT}`
  ctx.fillStyle = TEXT_DARK
  ctx.fillText('Budget vs Dépenses par établissement', 32, 36)

  if (data.length === 0 || data.every(d => d.budget === 0 && d.depenses === 0)) {
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText('Aucune donnée', W / 2, H / 2)
    return canvas.toBuffer('image/png')
  }

  const chartX = 100, chartY = 60, chartW = W - 160, chartH = H - 120
  const maxVal = Math.max(...data.flatMap(d => [d.budget, d.depenses]), 1)
  const tickCount = 5

  // Grille horizontale
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1
  for (let i = 0; i <= tickCount; i++) {
    const y = chartY + chartH - (i / tickCount) * chartH
    ctx.beginPath()
    ctx.moveTo(chartX, y)
    ctx.lineTo(chartX + chartW, y)
    ctx.stroke()
    ctx.font = `11px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.textAlign = 'right'
    ctx.fillText(euros((i / tickCount) * maxVal), chartX - 8, y + 4)
  }
  ctx.textAlign = 'left'

  // Barres groupées
  const groupW = chartW / data.length
  const barW = Math.min(28, groupW * 0.28)
  const gap = 4

  data.forEach((d, i) => {
    const gx = chartX + i * groupW + groupW / 2

    // Barre budget (gris clair)
    const bh = d.budget > 0 ? (d.budget / maxVal) * chartH : 0
    if (bh > 0) {
      drawRoundRect(ctx, gx - barW - gap / 2, chartY + chartH - bh, barW, bh, 3, '#CBD5E1')
    }

    // Barre dépenses (couleur primaire)
    const dh = d.depenses > 0 ? (d.depenses / maxVal) * chartH : 0
    if (dh > 0) {
      const overBudget = d.budget > 0 && d.depenses > d.budget
      drawRoundRect(ctx, gx + gap / 2, chartY + chartH - dh, barW, dh, 3, overBudget ? '#B71C1C' : '#1E4A8C')
    }

    // Label site
    ctx.font = `11px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.textAlign = 'center'
    const siteName = truncateLabel(ctx, d.name.length > 14 ? d.name.substring(0, 13) + '…' : d.name, groupW - 8)
    ctx.fillText(siteName, gx, chartY + chartH + 16)
    ctx.textAlign = 'left'
  })

  // Axe X
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(chartX, chartY + chartH)
  ctx.lineTo(chartX + chartW, chartY + chartH)
  ctx.stroke()

  // Légende
  const legY = H - 20
  const items = [
    { color: '#CBD5E1', label: 'Budget alloué' },
    { color: '#1E4A8C', label: 'Dépenses' },
    { color: '#B71C1C', label: 'Dépassement' },
  ]
  let legX = chartX
  ctx.font = `12px ${FONT}`
  items.forEach(({ color, label }) => {
    drawRoundRect(ctx, legX, legY - 10, 12, 12, 2, color)
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText(label, legX + 16, legY)
    legX += ctx.measureText(label).width + 44
  })

  return canvas.toBuffer('image/png')
}

// ─── 3. Bar mensuelle — Évolution des dépenses ───────────────────────────────

export function drawBarMensuel(
  data: { mois: string; depenses: number; budget: number }[],
  annee: number
): Buffer {
  const W = 800, H = 380
  const { canvas, ctx } = setupCanvas(W, H)

  ctx.font = `bold 18px ${FONT}`
  ctx.fillStyle = TEXT_DARK
  ctx.fillText(`Évolution mensuelle des dépenses — ${annee}`, 32, 36)

  const hasData = data.some(d => d.depenses > 0 || d.budget > 0)
  if (!hasData) {
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText('Aucune dépense enregistrée', W / 2, H / 2)
    return canvas.toBuffer('image/png')
  }

  const chartX = 80, chartY = 55, chartW = W - 120, chartH = H - 105
  const maxVal = Math.max(...data.flatMap(d => [d.depenses, d.budget]), 1) * 1.1
  const tickCount = 4
  const colW = chartW / 12

  // Grille
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1
  for (let i = 0; i <= tickCount; i++) {
    const y = chartY + chartH - (i / tickCount) * chartH
    ctx.beginPath()
    ctx.moveTo(chartX, y)
    ctx.lineTo(chartX + chartW, y)
    ctx.stroke()
    ctx.font = `11px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.textAlign = 'right'
    ctx.fillText(euros((i / tickCount) * maxVal), chartX - 8, y + 4)
  }
  ctx.textAlign = 'left'

  const barW = Math.min(20, colW * 0.5)
  const hasBudget = data.some(d => d.budget > 0)

  data.forEach((d, i) => {
    const cx = chartX + i * colW + colW / 2

    // Barre budget (fond gris)
    if (hasBudget && d.budget > 0) {
      const bh = (d.budget / maxVal) * chartH
      drawRoundRect(ctx, cx - barW / 2 - 1, chartY + chartH - bh, barW - 2, bh, 3, '#E2E8F0')
    }

    // Barre dépenses
    if (d.depenses > 0) {
      const dh = (d.depenses / maxVal) * chartH
      const over = hasBudget && d.budget > 0 && d.depenses > d.budget
      drawRoundRect(ctx, cx - barW / 2 + 1, chartY + chartH - dh, barW - 2, dh, 3, over ? '#B71C1C' : '#1E4A8C')
    }

    // Label mois
    ctx.font = `11px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.textAlign = 'center'
    ctx.fillText(d.mois, cx, chartY + chartH + 16)
    ctx.textAlign = 'left'
  })

  // Ligne de tendance (dépenses cumulées)
  const cumPoints: { x: number; y: number }[] = []
  let cumul = 0
  const maxCumul = data.reduce((s, d) => s + d.depenses, 0)
  if (maxCumul > 0) {
    data.forEach((d, i) => {
      if (d.depenses > 0 || cumul > 0) {
        cumul += d.depenses
        const px = chartX + i * colW + colW / 2
        const py = chartY + chartH - (cumul / maxCumul) * chartH * 0.85
        cumPoints.push({ x: px, y: py })
      }
    })

    if (cumPoints.length >= 2) {
      ctx.strokeStyle = '#2E75B6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      cumPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.stroke()
      ctx.setLineDash([])

      // Points sur la ligne
      cumPoints.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#2E75B6'
        ctx.fill()
      })
    }
  }

  // Axe X
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(chartX, chartY + chartH)
  ctx.lineTo(chartX + chartW, chartY + chartH)
  ctx.stroke()

  // Légende
  const legY = H - 14
  let legX = chartX
  const legendItems = [
    { color: '#1E4A8C', label: 'Dépenses' },
    ...(hasBudget ? [{ color: '#E2E8F0', label: 'Budget mensuel' }] : []),
    ...(cumPoints.length >= 2 ? [{ color: '#2E75B6', label: 'Cumul dépenses', dashed: true }] : []),
  ]
  ctx.font = `12px ${FONT}`
  legendItems.forEach(({ color, label, dashed }) => {
    if (dashed) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(legX, legY - 5)
      ctx.lineTo(legX + 20, legY - 5)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      drawRoundRect(ctx, legX, legY - 11, 12, 12, 2, color)
    }
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText(label, legX + 26, legY)
    legX += ctx.measureText(label).width + 52
  })

  return canvas.toBuffer('image/png')
}

// ─── 4. Horizontal bar — Consommation par catégorie ──────────────────────────

export function drawHorizontalBarCategories(
  data: { name: string; value: number; pct: number }[]
): Buffer {
  const W = 800, H = Math.max(280, 80 + data.length * 52)
  const { canvas, ctx } = setupCanvas(W, H)

  ctx.font = `bold 18px ${FONT}`
  ctx.fillStyle = TEXT_DARK
  ctx.fillText('Dépenses par catégorie', 32, 36)

  if (data.length === 0) {
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText('Aucune dépense', 32, 80)
    return canvas.toBuffer('image/png')
  }

  const barX = 220, barMaxW = W - barX - 140, rowH = 52, startY = 64

  data.forEach((d, i) => {
    const y = startY + i * rowH
    const color = PALETTE[i % PALETTE.length]

    // Fond de barre
    drawRoundRect(ctx, barX, y + 10, barMaxW, 22, 4, '#F1F5F9')

    // Barre remplie
    const filledW = Math.max(6, (d.pct / 100) * barMaxW)
    drawRoundRect(ctx, barX, y + 10, filledW, 22, 4, color)

    // Nom catégorie
    ctx.font = `13px ${FONT}`
    ctx.fillStyle = TEXT_DARK
    ctx.textAlign = 'right'
    ctx.fillText(truncateLabel(ctx, d.name, 180), barX - 12, y + 25)

    // Montant + %
    ctx.font = `bold 13px ${FONT}`
    ctx.fillStyle = TEXT_DARK
    ctx.textAlign = 'left'
    ctx.fillText(euros(d.value), barX + barMaxW + 10, y + 20)
    ctx.font = `11px ${FONT}`
    ctx.fillStyle = TEXT_MUTED
    ctx.fillText(pct(d.pct), barX + barMaxW + 10, y + 34)

    ctx.textAlign = 'left'
  })

  return canvas.toBuffer('image/png')
}
