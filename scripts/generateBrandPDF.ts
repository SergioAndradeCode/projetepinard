// Script à exécuter avec : npx tsx scripts/generateBrandPDF.ts
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

const PAGE_W = 595.28
const PAGE_H = 841.89
const M      = 52

// Palette Talenth
const C_GREEN      = rgb(0.098, 0.749, 0.204)  // #19BF34
const C_GREEN_A1   = rgb(0.314, 0.749, 0.098)  // #50BF19
const C_GREEN_A2   = rgb(0.098, 0.749, 0.533)  // #19BF88
const C_BLUE       = rgb(0.118, 0.290, 0.549)  // #1E4A8C
const C_BLUE_DARK  = rgb(0.059, 0.122, 0.235)  // #0F1F3C
const C_BLUE_LIGHT = rgb(0.922, 0.949, 0.980)  // #EBF2FA
const C_AMBER      = rgb(0.961, 0.620, 0.043)  // #F59E0B
const C_DARK       = rgb(0.102, 0.102, 0.180)  // #1A1A2E
const C_GRAY       = rgb(0.420, 0.447, 0.502)  // #6B7280
const C_GRAY_LIGHT = rgb(0.612, 0.647, 0.667)  // #9CA3AF
const C_BORDER     = rgb(0.886, 0.910, 0.941)  // #E2E8F0
const C_BG         = rgb(0.973, 0.980, 0.988)  // #F8FAFC
const C_WHITE      = rgb(1, 1, 1)

function r(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>, opacity = 1) {
  page.drawRectangle({ x, y, width: w, height: h, color, opacity })
}

function l(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = C_BORDER, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })
}

function t(
  page: PDFPage, content: string, x: number, y: number,
  font: PDFFont, size: number, color = C_DARK,
  align: 'left' | 'right' | 'center' = 'left', maxW?: number,
) {
  if (!content) return
  let s = content
  if (maxW) {
    while (s.length > 1 && font.widthOfTextAtSize(s, size) > maxW) s = s.slice(0, -1)
    if (s !== content) s = s.slice(0, -1) + '…'
  }
  const w = font.widthOfTextAtSize(s, size)
  let dx = x
  if (align === 'right') dx = x - w
  if (align === 'center') dx = x - w / 2
  page.drawText(s, { x: dx, y, font, size, color })
}

function sectionHeader(page: PDFPage, label: string, y: number, bold: PDFFont): number {
  r(page, M - 6, y - 4, PAGE_W - M * 2 + 12, 20, C_BLUE_LIGHT)
  t(page, label.toUpperCase(), M, y + 6, bold, 8, C_BLUE)
  return y - 24
}

async function run() {
  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)

  // ── Logo ─────────────────────────────────────────────────────────────────
  let logo = null
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
    logo = await doc.embedPng(logoBytes)
  } catch { /* continue sans logo */ }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Identité & Couleurs
  // ════════════════════════════════════════════════════════════════════════
  const p1 = doc.addPage([PAGE_W, PAGE_H])

  // Header
  r(p1, 0, PAGE_H - 100, PAGE_W, 100, C_BLUE_DARK)
  r(p1, 0, PAGE_H - 100, PAGE_W, 3, C_GREEN)
  if (logo) p1.drawImage(logo, { x: M, y: PAGE_H - 78, width: 52, height: 52 })
  const nameX = logo ? M + 64 : M
  t(p1, 'Talenth', nameX, PAGE_H - 44, bold, 26, C_WHITE)
  t(p1, 'Charte graphique officielle — Version 1.0', nameX, PAGE_H - 62, reg, 11, rgb(0.65, 0.80, 0.95))
  t(p1, 'Juin 2026', PAGE_W - M, PAGE_H - 44, reg, 10, rgb(0.5, 0.7, 0.9), 'right')
  t(p1, 'Usage interne et externe', PAGE_W - M, PAGE_H - 58, reg, 9, rgb(0.5, 0.65, 0.85), 'right')

  let y = PAGE_H - 130

  // ── Palette officielle ───────────────────────────────────────────────────
  y = sectionHeader(p1, '01 — Palette de couleurs officielle', y, bold)

  const swatches = [
    { hex: '#19BF34', c: C_GREEN,      name: 'Vert Talenth',  role: 'Couleur de marque principale' },
    { hex: '#50BF19', c: C_GREEN_A1,   name: 'Vert Jaune',    role: 'Analogue 1' },
    { hex: '#19BF88', c: C_GREEN_A2,   name: 'Vert Teal',     role: 'Analogue 2' },
    { hex: '#1E4A8C', c: C_BLUE,       name: 'Bleu Principal', role: 'Interface produit' },
    { hex: '#0F1F3C', c: C_BLUE_DARK,  name: 'Bleu Nuit',     role: 'Headers, fonds foncés' },
    { hex: '#F59E0B', c: C_AMBER,      name: 'Ambre',         role: 'Accent, badges, highlights' },
    { hex: '#1A1A2E', c: C_DARK,       name: 'Texte',         role: 'Corps, titres' },
    { hex: '#F8FAFC', c: C_BG,         name: 'Fond Clair',    role: 'Arrière-plans' },
  ]

  const cols = 4
  const sw   = (PAGE_W - M * 2) / cols - 6
  const sh   = 64

  swatches.forEach(({ hex, c, name, role }, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const sx = M + col * (sw + 6)
    const sy = y - row * (sh + 6)

    // Fond couleur
    r(p1, sx, sy - 34, sw, 34, c)
    if (hex === '#F8FAFC') {
      p1.drawRectangle({ x: sx, y: sy - 34, width: sw, height: 34, borderColor: C_BORDER, borderWidth: 0.5 })
    }
    // Fond info
    r(p1, sx, sy - sh, sw, sh - 34, C_WHITE)
    p1.drawRectangle({ x: sx, y: sy - sh, width: sw, height: sh, borderColor: C_BORDER, borderWidth: 0.5, borderLineCap: 0 as any })
    t(p1, name, sx + 6, sy - 46, bold, 7.5, C_DARK, 'left', sw - 8)
    t(p1, hex,  sx + 6, sy - 56, reg,  7,   C_GRAY, 'left', sw - 8)
    t(p1, role, sx + 6, sy - 66, reg,  6.5, C_GRAY_LIGHT, 'left', sw - 8)
  })

  y -= (Math.ceil(swatches.length / cols)) * (sh + 6) + 20

  // ── Rôle des couleurs ────────────────────────────────────────────────────
  y = sectionHeader(p1, '02 — Rôle des couleurs', y, bold)
  y -= 4

  const roleBlocks = [
    {
      color: C_GREEN, hex: '#19BF34', title: 'Vert — Communication de marque',
      items: ['Logo et favicon', 'Icônes de succès et validations', 'Documents externes (factures, emails)', 'CTA secondaires et badges']
    },
    {
      color: C_BLUE, hex: '#1E4A8C', title: 'Bleu — Interface produit',
      items: ['Boutons principaux, navigation', 'Liens, focus, sélections', 'Sidebar et headers d\'application', 'Formulaires et contrôles UI']
    },
    {
      color: C_AMBER, hex: '#F59E0B', title: 'Ambre — Accent',
      items: ['Badge "Recommandé"', 'Total TTC sur les factures', 'Highlights et mises en avant', 'Avertissements non critiques']
    },
  ]

  const bw = (PAGE_W - M * 2 - 16) / 3
  for (let i = 0; i < roleBlocks.length; i++) {
    const { color, title, items } = roleBlocks[i]
    const bx = M + i * (bw + 8)
    const bh = 90
    r(p1, bx, y - bh, bw, bh, C_BG)
    p1.drawRectangle({ x: bx, y: y - bh, width: bw, height: bh, borderColor: C_BORDER, borderWidth: 0.5 })
    r(p1, bx, y - 18, bw, 18, color)
    t(p1, title, bx + 8, y - 10, bold, 7, C_WHITE, 'left', bw - 16)
    items.forEach((item, j) => {
      t(p1, `· ${item}`, bx + 8, y - 30 - j * 13, reg, 7, C_DARK, 'left', bw - 16)
    })
  }
  y -= 110

  // ── Typographie ──────────────────────────────────────────────────────────
  y = sectionHeader(p1, '03 — Typographie : Inter (Google Fonts)', y, bold)
  y -= 4

  const typoRows = [
    { spec: 'H1 · 40px · Black 900',    sample: 'Titre principal',         size: 18, font: bold },
    { spec: 'H2 · 28px · ExtraBold 800', sample: 'Titre de section',       size: 15, font: bold },
    { spec: 'H3 · 20px · Bold 700',      sample: 'Sous-titre',             size: 12, font: bold },
    { spec: 'Body · 15px · Regular 400', sample: 'Texte courant et descriptions.', size: 10, font: reg },
    { spec: 'Caption · 12px · 400',      sample: 'Notes, légendes, mentions légales.', size: 8.5, font: reg },
  ]

  for (const { spec, sample, size, font } of typoRows) {
    t(p1, spec,   M, y, reg, 7.5, C_GRAY)
    t(p1, sample, M + 170, y, font, size, C_DARK)
    y -= size + 10
    l(p1, M, y + 2, PAGE_W - M, y + 2)
    y -= 6
  }

  y -= 8

  // ── Ton éditorial ────────────────────────────────────────────────────────
  y = sectionHeader(p1, '04 — Ton éditorial', y, bold)
  y -= 4

  const tones = [
    { tag: 'Expert', color: C_GREEN,  desc: 'Chiffres, preuves, précision. Phrases concises. On ne noie pas, on va à l\'essentiel.' },
    { tag: 'Engagé', color: C_BLUE,   desc: 'La mission handicap compte. On parle avec conviction, pas seulement de conformité.' },
    { tag: 'Humain', color: C_AMBER,  desc: 'On s\'adresse aux personnes, pas aux services. Ton direct, sans jargon RH.' },
  ]

  const tw = (PAGE_W - M * 2 - 16) / 3
  for (let i = 0; i < tones.length; i++) {
    const { tag, color, desc } = tones[i]
    const tx = M + i * (tw + 8)
    const th = 52
    r(p1, tx, y - th, tw, th, C_BG)
    p1.drawRectangle({ x: tx, y: y - th, width: tw, height: th, borderColor: C_BORDER, borderWidth: 0.5 })
    r(p1, tx, y - 16, tw, 16, color)
    t(p1, tag, tx + 8, y - 8, bold, 8, C_WHITE)
    const words = desc.split(' ')
    let line = ''; let ly = y - 28
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (reg.widthOfTextAtSize(test, 7.5) > tw - 16) {
        t(p1, line, tx + 8, ly, reg, 7.5, C_DARK, 'left', tw - 16); ly -= 10; line = w
      } else { line = test }
    }
    if (line) t(p1, line, tx + 8, ly, reg, 7.5, C_DARK, 'left', tw - 16)
  }

  y -= 70

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2 — Logo & Règles
  // ════════════════════════════════════════════════════════════════════════
  const p2 = doc.addPage([PAGE_W, PAGE_H])

  // Header page 2
  r(p2, 0, PAGE_H - 50, PAGE_W, 50, C_BLUE_DARK)
  r(p2, 0, PAGE_H - 50, PAGE_W, 3, C_GREEN)
  t(p2, 'Talenth — Charte graphique', M, PAGE_H - 28, bold, 13, C_WHITE)
  t(p2, 'Logo & Règles d\'usage', M, PAGE_H - 42, reg, 9, rgb(0.65, 0.80, 0.95))
  t(p2, '2 / 2', PAGE_W - M, PAGE_H - 28, reg, 9, rgb(0.5, 0.7, 0.9), 'right')

  let y2 = PAGE_H - 80

  // ── Logo ─────────────────────────────────────────────────────────────────
  y2 = sectionHeader(p2, '05 — Logo officiel', y2, bold)
  y2 -= 10

  // Fond blanc
  const logoBoxH = 90
  r(p2, M, y2 - logoBoxH, (PAGE_W - M * 2) / 2 - 8, logoBoxH, C_WHITE)
  p2.drawRectangle({ x: M, y: y2 - logoBoxH, width: (PAGE_W - M * 2) / 2 - 8, height: logoBoxH, borderColor: C_BORDER, borderWidth: 0.5 })
  t(p2, 'Fond blanc', M + 8, y2 - 14, reg, 7, C_GRAY)
  if (logo) p2.drawImage(logo, { x: M + 20, y: y2 - logoBoxH + 20, width: 50, height: 50 })
  t(p2, 'Talenth', M + 80, y2 - logoBoxH / 2 + 6, bold, 18, C_BLUE)

  // Fond bleu nuit
  const bx2 = M + (PAGE_W - M * 2) / 2 + 8
  r(p2, bx2, y2 - logoBoxH, (PAGE_W - M * 2) / 2 - 8, logoBoxH, C_BLUE_DARK)
  t(p2, 'Fond bleu nuit', bx2 + 8, y2 - 14, reg, 7, rgb(0.5, 0.7, 0.9))
  if (logo) p2.drawImage(logo, { x: bx2 + 20, y: y2 - logoBoxH + 20, width: 50, height: 50 })
  t(p2, 'Talenth', bx2 + 80, y2 - logoBoxH / 2 + 6, bold, 18, C_WHITE)

  y2 -= logoBoxH + 20

  // ── Spécifications logo ───────────────────────────────────────────────────
  y2 = sectionHeader(p2, '06 — Spécifications du logo', y2, bold)
  y2 -= 6

  const specs = [
    ['Taille minimale', '24 px de hauteur'],
    ['Ratio d\'aspect', 'Carré (1:1) — ne jamais déformer'],
    ['Format fichier', 'PNG avec transparence (RGBA)'],
    ['Résolution', '8945 × 8945 px — export en toute taille'],
    ['Espace de protection', 'Marge équivalente à 1/4 de la hauteur du logo autour'],
  ]

  for (const [label, value] of specs) {
    t(p2, label + ' :', M, y2, bold, 8.5, C_DARK)
    t(p2, value, M + 140, y2, reg, 8.5, C_DARK)
    y2 -= 16
    l(p2, M, y2 + 4, PAGE_W - M, y2 + 4)
  }
  y2 -= 16

  // ── Autorisé / Interdit ──────────────────────────────────────────────────
  y2 = sectionHeader(p2, '07 — Usage du logo : autorisé et interdit', y2, bold)
  y2 -= 6

  const aw = (PAGE_W - M * 2) / 2 - 6
  const ah = 100

  r(p2, M, y2 - ah, aw, ah, rgb(0.94, 0.99, 0.95))
  p2.drawRectangle({ x: M, y: y2 - ah, width: aw, height: ah, borderColor: rgb(0.098, 0.749, 0.204), borderWidth: 0.5 })
  t(p2, 'AUTORISÉ', M + 8, y2 - 14, bold, 8, C_GREEN)
  const ok = ['Sur fond blanc ou clair', 'Sur fond bleu nuit (#0F1F3C)', 'Taille minimum 24px', 'Avec ou sans nom "Talenth" à droite', 'Ratio d\'aspect conservé (carré)']
  ok.forEach((s, i) => {
    t(p2, '+ ' + s, M + 8, y2 - 28 - i * 14, reg, 7.5, C_DARK)
  })

  const rx = M + aw + 12
  r(p2, rx, y2 - ah, aw, ah, rgb(0.99, 0.94, 0.94))
  p2.drawRectangle({ x: rx, y: y2 - ah, width: aw, height: ah, borderColor: rgb(0.89, 0.29, 0.29), borderWidth: 0.5 })
  t(p2, 'INTERDIT', rx + 8, y2 - 14, bold, 8, rgb(0.72, 0.12, 0.12))
  const no = ['Modifier les couleurs du logo', 'Déformer ou étirer le logo', 'Ajouter des effets (ombre, flou)', 'Sur fond vert (illisible)', 'En dessous de 24px de hauteur']
  no.forEach((s, i) => {
    t(p2, '- ' + s, rx + 8, y2 - 28 - i * 14, reg, 7.5, C_DARK)
  })

  y2 -= ah + 20

  // ── Applications ─────────────────────────────────────────────────────────
  y2 = sectionHeader(p2, '08 — Applications de la marque', y2, bold)
  y2 -= 6

  const apps = [
    { title: 'Interface SaaS', items: ['Sidebar et navigation (bleu #1E4A8C)', 'Boutons principaux (bleu)', 'États de succès, validations (vert #19BF34)', 'Badges et highlights (ambre #F59E0B)'] },
    { title: 'Communication externe', items: ['Factures PDF (logo + header bleu nuit + liseré vert)', 'Emails transactionnels (FROM noreply@talenth.fr)', 'Page /tarifs et /commander', 'Documents contractuels'] },
    { title: 'Règles générales', items: ['Toujours utiliser lib/brand.ts comme référence', 'Jamais de style inline contredisant la charte', 'Police Inter sur tous les supports digitaux', 'Ton : Expert · Engagé · Humain'] },
  ]

  const cw = (PAGE_W - M * 2 - 16) / 3
  for (let i = 0; i < apps.length; i++) {
    const { title, items } = apps[i]
    const cx = M + i * (cw + 8)
    const ch = 90
    r(p2, cx, y2 - ch, cw, ch, C_BG)
    p2.drawRectangle({ x: cx, y: y2 - ch, width: cw, height: ch, borderColor: C_BORDER, borderWidth: 0.5 })
    r(p2, cx, y2 - 18, cw, 18, C_BLUE)
    t(p2, title, cx + 8, y2 - 10, bold, 7.5, C_WHITE, 'left', cw - 16)
    items.forEach((item, j) => {
      t(p2, `· ${item}`, cx + 8, y2 - 30 - j * 14, reg, 6.5, C_DARK, 'left', cw - 16)
    })
  }

  y2 -= 110

  // ── Footer pages ─────────────────────────────────────────────────────────
  for (const pg of [p1, p2]) {
    r(pg, 0, 0, PAGE_W, 28, C_BLUE_DARK)
    r(pg, 0, 28, PAGE_W, 2, C_GREEN)
    if (logo) pg.drawImage(logo, { x: M, y: 6, width: 16, height: 16 })
    t(pg, 'Talenth · Charte graphique v1.0 · Juin 2026 · talenthsupport@gmail.com', M + 22, 11, reg, 7, rgb(0.65, 0.80, 0.95))
    t(pg, 'Confidentiel — Usage interne et externe autorisé', PAGE_W - M, 11, reg, 7, rgb(0.5, 0.65, 0.85), 'right')
  }

  const pdfBytes = await doc.save()
  const outPath  = path.join(process.cwd(), 'public', 'Talenth_Charte_Graphique_v1.pdf')
  fs.writeFileSync(outPath, pdfBytes)
  console.log(`PDF généré : ${outPath}`)
}

run().catch(console.error)
