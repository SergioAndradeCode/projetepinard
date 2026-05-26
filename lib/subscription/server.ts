import { createClient } from '@/lib/supabase/server'
import { planHasFeature, type FeatureKey, type PlanId } from '@/lib/plans'
import { NextResponse } from 'next/server'

interface OrgSubscription {
  plan_id: PlanId | null
  subscription_status: string
  trial_ends_at: string | null
}

export async function requireFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<{ error: NextResponse } | { ok: true }> {
  const supabase = createClient()

  const { data } = await supabase
    .from('organizations')
    .select('plan_id, subscription_status, trial_ends_at')
    .eq('id', organizationId)
    .single<OrgSubscription>()

  if (!data) {
    return { error: NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 }) }
  }

  const now = new Date()
  const isTrialing = data.subscription_status === 'trialing' &&
    data.trial_ends_at !== null &&
    new Date(data.trial_ends_at) > now

  const isActive = data.subscription_status === 'active' || isTrialing

  if (!isActive || !planHasFeature(data.plan_id, feature)) {
    return {
      error: NextResponse.json(
        { error: 'Cette fonctionnalité nécessite un abonnement supérieur.', feature },
        { status: 403 }
      ),
    }
  }

  return { ok: true }
}
