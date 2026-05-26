import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { PLANS, type PlanId, type BillingCycle } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { planId, billingCycle }: { planId: PlanId; billingCycle: BillingCycle } = await req.json()

  if (!PLANS[planId] || !PLANS[planId].prices[billingCycle]) {
    return NextResponse.json({ error: 'Plan ou cycle invalide' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organizations(stripe_customer_id, name)')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  const org = (profile.organizations as unknown) as { stripe_customer_id: string | null; name: string } | null
  const orgId = profile.organization_id
  const plan = PLANS[planId]
  const price = plan.prices[billingCycle]

  if (!price.stripePriceId) {
    return NextResponse.json({ error: 'Price ID Stripe non configuré' }, { status: 500 })
  }

  let customerId = org?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org?.name ?? undefined,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id
    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', orgId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card', 'sepa_debit'],
    line_items: [{ price: price.stripePriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/settings/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/settings/billing?canceled=1`,
    metadata: {
      organization_id: orgId,
      plan_id: planId,
      billing_cycle: billingCycle,
    },
    subscription_data: {
      metadata: { organization_id: orgId, plan_id: planId, billing_cycle: billingCycle },
    },
    locale: 'fr',
  })

  return NextResponse.json({ url: session.url })
}
