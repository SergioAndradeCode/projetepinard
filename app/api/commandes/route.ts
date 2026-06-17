import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoice } from '@/lib/pdf/generateInvoice'
import { sendOrderConfirmation } from '@/lib/emails/sendOrderConfirmation'
import { sendAdminNotification } from '@/lib/emails/sendAdminNotification'

// ── Pricing HT (en euros) ─────────────────────────────────────────────────
const PLAN_PRICING: Record<string, Record<string, { ht: number; label: string; planName: string }>> = {
  essentiel: {
    monthly:        { ht: 39,   label: 'Mensuel',              planName: 'Essentiel' },
    annual_monthly: { ht: 33,   label: 'Annuel mensuel',       planName: 'Essentiel' },
    annual_upfront: { ht: 396,  label: 'Annuel en 1 paiement', planName: 'Essentiel' },
  },
  equipe: {
    monthly:        { ht: 89,   label: 'Mensuel',              planName: 'Équipe' },
    annual_monthly: { ht: 75,   label: 'Annuel mensuel',       planName: 'Équipe' },
    annual_upfront: { ht: 900,  label: 'Annuel en 1 paiement', planName: 'Équipe' },
  },
  organisation: {
    monthly:        { ht: 179,  label: 'Mensuel',              planName: 'Organisation' },
    annual_monthly: { ht: 152,  label: 'Annuel mensuel',       planName: 'Organisation' },
    annual_upfront: { ht: 1824, label: 'Annuel en 1 paiement', planName: 'Organisation' },
  },
}

// ── Rate limiting (in-memory, par IP) ────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// ── Validation ────────────────────────────────────────────────────────────
function isValidSiret(s: string): boolean {
  return /^\d{14}$/.test(s.replace(/\s/g, ''))
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

function sanitize(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.trim().replace(/<[^>]*>/g, '').slice(0, 500)
}

// ── Supabase admin client (service role) ─────────────────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Trop de demandes. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  // ── Validation serveur ───────────────────────────────────────────────────
  const companyName     = sanitize(body.companyName)
  const siret           = sanitize(body.siret).replace(/\s/g, '')
  const billingAddress  = sanitize(body.billingAddress)
  const postalCode      = sanitize(body.postalCode)
  const city            = sanitize(body.city)
  const country         = sanitize(body.country) || 'France'
  const firstname       = sanitize(body.firstname)
  const lastname        = sanitize(body.lastname)
  const contactFunction = sanitize(body.contactFunction)
  const email           = sanitize(body.email).toLowerCase()
  const phone           = sanitize(body.phone)
  const plan            = sanitize(body.plan).toLowerCase()
  const billingCycle    = sanitize(body.billingCycle)
  const purchaseOrderNb = sanitize(body.purchaseOrderNumber)
  const message         = sanitize(body.message).slice(0, 1000)

  const errors: string[] = []
  if (!companyName)                               errors.push('Raison sociale manquante.')
  if (!isValidSiret(siret))                       errors.push('SIRET invalide (14 chiffres requis).')
  if (!billingAddress)                            errors.push('Adresse de facturation manquante.')
  if (!postalCode)                                errors.push('Code postal manquant.')
  if (!city)                                      errors.push('Ville manquante.')
  if (!firstname)                                 errors.push('Prénom manquant.')
  if (!lastname)                                  errors.push('Nom manquant.')
  if (!isValidEmail(email))                       errors.push('Email invalide.')
  if (!PLAN_PRICING[plan])                        errors.push('Plan invalide.')
  if (plan && !PLAN_PRICING[plan]?.[billingCycle]) errors.push('Cycle de facturation invalide.')

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 })
  }

  const pricing = PLAN_PRICING[plan][billingCycle]
  const amountHt  = pricing.ht
  const amountTva = parseFloat((amountHt * 0.2).toFixed(2))
  const amountTtc = parseFloat((amountHt + amountTva).toFixed(2))

  const supabase = getAdminClient()

  // ── Numéro de facture (TAL-YYYY-NNNN) ────────────────────────────────────
  let invoiceNumber: string
  try {
    const year = new Date().getFullYear()
    const prefix = `TAL-${year}-`

    const { data: last } = await supabase
      .from('orders')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNum = 1
    if (last?.invoice_number) {
      const lastNum = parseInt(last.invoice_number.split('-')[2] ?? '0', 10)
      nextNum = lastNum + 1
    }
    invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`
  } catch (err) {
    console.error('[commandes] Erreur génération numéro facture:', err)
    return NextResponse.json({ error: 'Erreur interne. Réessayez.' }, { status: 500 })
  }

  // ── Dates ─────────────────────────────────────────────────────────────────
  const issueDate = new Date()
  const dueDate   = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + 30)

  const activationToken = crypto.randomUUID()

  // ── Insertion en base ─────────────────────────────────────────────────────
  try {
    const { error } = await supabase.from('orders').insert({
      invoice_number:        invoiceNumber,
      company_name:          companyName,
      siret,
      billing_address:       billingAddress,
      postal_code:           postalCode,
      city,
      country,
      contact_firstname:     firstname,
      contact_lastname:      lastname,
      contact_function:      contactFunction || null,
      contact_email:         email,
      contact_phone:         phone || null,
      plan,
      billing_cycle:         billingCycle,
      amount_ht:             amountHt,
      amount_tva:            amountTva,
      amount_ttc:            amountTtc,
      purchase_order_number: purchaseOrderNb || null,
      message:               message || null,
      status:                'pending_payment',
      activation_token:      activationToken,
      invoice_due_date:      dueDate.toISOString().split('T')[0],
    })
    if (error) throw error
  } catch (err) {
    console.error('[commandes] Erreur insertion Supabase:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement. Réessayez.' }, { status: 500 })
  }

  // ── Génération PDF ────────────────────────────────────────────────────────
  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateInvoice({
      invoiceNumber,
      issueDate,
      dueDate,
      companyName,
      siret,
      billingAddress,
      postalCode,
      city,
      country,
      planName:          pricing.planName,
      billingCycleLabel: pricing.label,
      amountHt,
      amountTva,
      amountTtc,
    })
  } catch (err) {
    console.error('[commandes] Erreur génération PDF:', err)
    // On continue même si le PDF échoue — on envoie sans pièce jointe
    pdfBytes = new Uint8Array(0)
  }

  // ── Envoi emails ──────────────────────────────────────────────────────────
  const emailErrors: string[] = []

  try {
    if (pdfBytes.length > 0) {
      await sendOrderConfirmation({
        to: email,
        firstname,
        invoiceNumber,
        planName:  pricing.planName,
        amountTtc,
        dueDate,
        invoicePdf: pdfBytes,
      })
    }
  } catch (err) {
    emailErrors.push('client')
    console.error('[commandes] Erreur email client:', err)
  }

  try {
    await sendAdminNotification({
      invoiceNumber,
      companyName,
      siret,
      contactName:       `${firstname} ${lastname}`,
      contactEmail:      email,
      contactFunction:   contactFunction || undefined,
      planName:          pricing.planName,
      billingCycleLabel: pricing.label,
      amountTtc,
      dueDate,
      activationToken,
    })
  } catch (err) {
    emailErrors.push('admin')
    console.error('[commandes] Erreur email admin:', err)
  }

  return NextResponse.json({
    success:       true,
    invoiceNumber,
    amountTtc,
    planName:      pricing.planName,
    emailPartial:  emailErrors.length > 0,
  })
}
