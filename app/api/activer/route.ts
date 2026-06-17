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

  // ── Récupérer la commande par token ───────────────────────────────────────
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

  // ── Activation ────────────────────────────────────────────────────────────
  // 1. Invalider le token + passer le statut à active
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
    return NextResponse.json({ error: 'Erreur lors de l\'activation.' }, { status: 500 })
  }

  // 2. Créer l'utilisateur dans Supabase Auth
  const tempPassword = generateTempPassword()
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:             order.contact_email,
    password:          tempPassword,
    email_confirm:     true,
    user_metadata: {
      full_name: `${order.contact_firstname} ${order.contact_lastname}`,
    },
  })

  if (authError) {
    // Si l'utilisateur existe déjà (email déjà inscrit via essai gratuit), on continue sans erreur fatale
    if (authError.message?.includes('already been registered')) {
      console.warn('[activer] Utilisateur déjà existant:', order.contact_email)
    } else {
      console.error('[activer] Erreur création utilisateur Auth:', authError)
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }
  }

  const userId = authData?.user?.id

  // 3. Créer le profil si l'utilisateur a bien été créé
  if (userId) {
    await supabase.from('profiles').upsert(
      { id: userId, full_name: `${order.contact_firstname} ${order.contact_lastname}` },
      { onConflict: 'id' },
    )
  }

  // 4. Envoyer email de bienvenue
  try {
    await sendWelcome({
      to:           order.contact_email,
      firstname:    order.contact_firstname,
      tempPassword: authError ? '[utilisez votre mot de passe existant]' : tempPassword,
    })
  } catch (err) {
    console.error('[activer] Erreur email bienvenue:', err)
    // Non-fatal : le compte est activé même si l'email échoue
  }

  return NextResponse.json({
    success:  true,
    action:   'activated',
    email:    order.contact_email,
    company:  order.company_name,
  })
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
