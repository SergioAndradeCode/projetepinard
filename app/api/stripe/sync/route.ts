import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/stripe/sync
 *
 * Synchronise l'abonnement depuis Stripe directement après un checkout réussi.
 * Appelé côté client avec le session_id Stripe — contourne le webhook
 * (indispensable en développement où localhost n'est pas joignable par Stripe).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'session_id requis' }, { status: 400 })

  // Récupère la session Stripe avec l'abonnement étendu
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
  } catch (err) {
    console.error('[stripe/sync] Session introuvable:', err)
    return NextResponse.json({ error: 'Session Stripe introuvable' }, { status: 404 })
  }

  // Vérifie que le paiement est bien confirmé
  const isPaid = session.payment_status === 'paid' || session.status === 'complete'
  if (!isPaid) {
    return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
  }

  const { organization_id, plan_id, billing_cycle } = session.metadata ?? {}
  if (!organization_id || !plan_id) {
    return NextResponse.json({ error: 'Métadonnées manquantes dans la session Stripe' }, { status: 400 })
  }

  // Sécurité : vérifie que l'organisation appartient à l'utilisateur authentifié
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.organization_id !== organization_id) {
    return NextResponse.json({ error: 'Accès non autorisé à cette organisation' }, { status: 403 })
  }

  // Calcule la date de fin de période
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as { id: string } | null)?.id ?? null

  let periodEnd: string | null = null
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString()
  } else {
    // Fallback : pas de subscription Stripe (cas exceptionnel)
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    periodEnd = d.toISOString()
  }

  // Met à jour l'organisation avec le client admin (bypass RLS)
  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from('organizations')
    .update({
      plan_id,
      billing_cycle:          billing_cycle ?? null,
      subscription_status:    'active',
      stripe_subscription_id: subscriptionId,
      current_period_end:     periodEnd,
      trial_ends_at:          null,
    })
    .eq('id', organization_id)

  if (updateError) {
    console.error('[stripe/sync] Erreur Supabase:', updateError)
    return NextResponse.json({ error: 'Erreur de mise à jour en base' }, { status: 500 })
  }

  // Enregistre l'événement dans subscription_events
  await admin.from('subscription_events').insert({
    organization_id,
    event_type:      'sync.checkout',
    plan_id,
    billing_cycle:   billing_cycle ?? null,
    stripe_event_id: session.id,
    payload:         { session_id: session.id, synced_at: new Date().toISOString() },
  }).then(() => {/* non bloquant */})

  return NextResponse.json({ success: true, plan_id, billing_cycle })
}
