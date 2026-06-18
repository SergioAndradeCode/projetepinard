import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcome } from '@/lib/emails/sendWelcome'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// orders.billing_cycle → organizations.billing_cycle (contrainte différente)
function mapBillingCycle(cycle: string): string {
  if (cycle === 'annual_upfront') return 'annual_prepaid'
  return cycle
}

// Date de fin d'abonnement selon le cycle
function calcPeriodEnd(cycle: string): string {
  const d = new Date()
  if (cycle === 'monthly') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setFullYear(d.getFullYear() + 1)
  }
  return d.toISOString()
}

export async function POST(req: NextRequest) {
  let body: { token?: string; action?: 'activate' | 'cancel' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const { token, action } = body
  if (!token || !action) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const supabase = getAdminClient()

  // ── Récupérer la commande par token ──────────────────────────────────────
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('activation_token', token)
    .eq('status', 'pending_payment')
    .maybeSingle()

  if (fetchError || !order) {
    return NextResponse.json(
      { error: 'Lien invalide, expiré ou déjà utilisé.' },
      { status: 404 },
    )
  }

  if (action === 'cancel') {
    await supabase
      .from('orders')
      .update({ status: 'cancelled', activation_token: null })
      .eq('id', order.id)
    return NextResponse.json({ success: true, action: 'cancelled' })
  }

  if (action !== 'activate') {
    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
  }

  // ── 1. Invalider le token + passer la commande à active ──────────────────
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status:           'active',
      activated_at:     new Date().toISOString(),
      activation_token: null,
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('[activer] Erreur mise à jour ordre:', updateError)
    return NextResponse.json({ error: "Erreur lors de l'activation." }, { status: 500 })
  }

  // ── 2. Créer ou récupérer l'utilisateur Auth ─────────────────────────────
  const tempPassword = generateTempPassword()
  const fullName = `${order.contact_firstname} ${order.contact_lastname}`

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:          order.contact_email,
    password:       tempPassword,
    email_confirm:  true,
    user_metadata:  { full_name: fullName },
  })

  let userId = authData?.user?.id
  let isExistingUser = false

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      // Utilisateur existant (ex: avait un essai gratuit) — retrouver son ID
      isExistingUser = true
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      userId = userList?.users?.find(u => u.email === order.contact_email)?.id
    } else {
      console.error('[activer] Erreur création utilisateur Auth:', authError)
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }
  }

  if (!userId) {
    console.error('[activer] Impossible de déterminer userId pour', order.contact_email)
    return NextResponse.json({ error: 'Erreur de résolution du compte utilisateur.' }, { status: 500 })
  }

  // ── 3. Organisation + profil ─────────────────────────────────────────────
  const billingCycle  = mapBillingCycle(order.billing_cycle)
  const periodEnd     = calcPeriodEnd(order.billing_cycle)

  if (isExistingUser) {
    // L'utilisateur avait déjà un compte (trial) — mettre à jour son organisation existante
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (existingProfile?.organization_id) {
      // Mettre l'org existante en active avec le bon plan
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          plan_id:             order.plan,
          billing_cycle:       billingCycle,
          current_period_end:  periodEnd,
          trial_ends_at:       null,
        })
        .eq('id', existingProfile.organization_id)

      // S'assurer que le profil est admin
      await supabase
        .from('profiles')
        .update({ full_name: fullName, role: 'admin' })
        .eq('id', userId)
    } else {
      // Utilisateur existant mais sans org — lui en créer une
      await createOrgAndLinkProfile(supabase, userId, fullName, String(order.company_name), String(order.plan), billingCycle, periodEnd)
    }
  } else {
    // Nouvel utilisateur — créer org + profil complet
    await createOrgAndLinkProfile(supabase, userId, fullName, String(order.company_name), String(order.plan), billingCycle, periodEnd)
  }

  // ── 4. Email de bienvenue ────────────────────────────────────────────────
  try {
    await sendWelcome({
      to:           order.contact_email,
      firstname:    order.contact_firstname,
      tempPassword: isExistingUser ? '[utilisez votre mot de passe existant]' : tempPassword,
    })
  } catch (err) {
    console.error('[activer] Erreur email bienvenue:', err)
  }

  return NextResponse.json({
    success: true,
    action:  'activated',
    email:   order.contact_email,
    company: order.company_name,
  })
}

async function createOrgAndLinkProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId:       string,
  fullName:     string,
  orgName:      string,
  planId:       string,
  billingCycle: string,
  periodEnd:    string,
) {
  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name:                orgName,
      plan_id:             planId,
      billing_cycle:       billingCycle,
      subscription_status: 'active',
      current_period_end:  periodEnd,
      trial_ends_at:       null,
    })
    .select('id')
    .single()

  if (orgError || !newOrg) {
    console.error('[activer] Erreur création organisation:', orgError)
    return
  }

  await supabase.from('profiles').upsert(
    {
      id:              userId,
      full_name:       fullName,
      organization_id: newOrg.id,
      role:            'admin',
    },
    { onConflict: 'id' },
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  const supabase = getAdminClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, invoice_number, company_name, siret, contact_firstname, contact_lastname, contact_function, contact_email, plan, billing_cycle, amount_ttc, invoice_due_date, status, created_at')
    .eq('activation_token', token)
    .eq('status', 'pending_payment')
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: 'Lien invalide, expiré ou déjà utilisé.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
