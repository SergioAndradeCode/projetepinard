import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations(stripe_customer_id)')
    .eq('id', user.id)
    .single()

  const customerId = (profile?.organizations as unknown as { stripe_customer_id: string | null } | null)?.stripe_customer_id

  if (!customerId) {
    return NextResponse.json({ error: 'Aucun customer Stripe associé' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings/billing`,
    locale: 'fr',
  })

  return NextResponse.json({ url: session.url })
}
