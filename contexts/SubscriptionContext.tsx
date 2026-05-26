'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PlanId, FeatureKey, BillingCycle,
  planHasFeature, canAddEstablishment, canAddUser, PLANS,
} from '@/lib/plans'

interface SubscriptionState {
  planId: PlanId | null
  billingCycle: BillingCycle | null
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  isActive: boolean
  isTrialing: boolean
  isExpired: boolean
  loading: boolean
}

interface SubscriptionContextType extends SubscriptionState {
  hasFeature: (feature: FeatureKey) => boolean
  canAddEstablishment: (currentCount: number) => boolean
  canAddUser: (currentCount: number) => boolean
  maxEstablishments: number | null
  maxUsers: number | null
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

interface SubscriptionProviderProps {
  children: React.ReactNode
  organizationId: string | null
}

export function SubscriptionProvider({ children, organizationId }: SubscriptionProviderProps) {
  const supabase = createClient()
  const [state, setState] = useState<SubscriptionState>({
    planId: null,
    billingCycle: null,
    status: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    isActive: false,
    isTrialing: false,
    isExpired: false,
    loading: true,
  })

  const fetchSubscription = useCallback(async () => {
    if (!organizationId) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    const { data } = await supabase
      .from('organizations')
      .select('plan_id, billing_cycle, subscription_status, trial_ends_at, current_period_end')
      .eq('id', organizationId)
      .single()

    if (!data) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    const now = new Date()
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null
    const isTrialing = data.subscription_status === 'trialing' && trialEndsAt !== null && trialEndsAt > now
    const isActive = data.subscription_status === 'active' || isTrialing
    const isExpired =
      data.subscription_status === 'canceled' ||
      (data.subscription_status === 'trialing' && trialEndsAt !== null && trialEndsAt <= now)

    setState({
      planId: data.plan_id as PlanId | null,
      billingCycle: data.billing_cycle as BillingCycle | null,
      status: data.subscription_status as SubscriptionState['status'],
      trialEndsAt,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
      isActive,
      isTrialing,
      isExpired,
      loading: false,
    })
  }, [organizationId, supabase])

  useEffect(() => { fetchSubscription() }, [fetchSubscription])

  const plan = state.planId ? PLANS[state.planId] : null

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      hasFeature: (feature) => state.isActive && planHasFeature(state.planId, feature),
      canAddEstablishment: (count) => state.isActive && canAddEstablishment(state.planId, count),
      canAddUser: (count) => state.isActive && canAddUser(state.planId, count),
      maxEstablishments: plan?.maxEstablishments ?? null,
      maxUsers: plan?.maxUsers ?? null,
      refetch: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

export function useFeature(feature: FeatureKey) {
  const { hasFeature } = useSubscription()
  return hasFeature(feature)
}
