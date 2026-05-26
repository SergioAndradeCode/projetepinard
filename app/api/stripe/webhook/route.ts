import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { organization_id, plan_id, billing_cycle } = session.metadata ?? {}
        if (!organization_id || !plan_id) break

        const subscriptionId = session.subscription as string | null
        let periodEnd: string | null = null

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString()
        } else {
          // Paiement unique annuel
          const d = new Date()
          d.setFullYear(d.getFullYear() + 1)
          periodEnd = d.toISOString()
        }

        await supabase.from('organizations').update({
          plan_id,
          billing_cycle: billing_cycle ?? null,
          subscription_status: 'active',
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
          trial_ends_at: null,
        }).eq('id', organization_id)

        await supabase.from('subscription_events').insert({
          organization_id,
          event_type: 'checkout.completed',
          plan_id,
          billing_cycle: billing_cycle ?? null,
          stripe_event_id: event.id,
          payload: session as unknown as Record<string, unknown>,
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (org) {
          await supabase.from('organizations').update({
            plan_id: sub.metadata.plan_id ?? null,
            billing_cycle: sub.metadata.billing_cycle ?? null,
            subscription_status: sub.status,
            current_period_end: new Date(sub.items.data[0].current_period_end * 1000).toISOString(),
          }).eq('id', org.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase.from('organizations').update({
          plan_id: null,
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          current_period_end: null,
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase.from('organizations').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer as string)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase.from('organizations').update({
          subscription_status: 'active',
        }).eq('stripe_customer_id', invoice.customer as string)
        break
      }
    }
  } catch (err) {
    console.error('[Stripe webhook] Erreur de traitement:', err)
    // On retourne 200 pour éviter les retry Stripe — l'erreur est loggée
  }

  return NextResponse.json({ received: true })
}
