'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { FeatureKey, FEATURES, PLANS } from '@/lib/plans'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface FeatureGateProps {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
  silent?: boolean
}

export function FeatureGate({ feature, children, fallback, silent = false }: FeatureGateProps) {
  const { hasFeature, isExpired } = useSubscription()

  if (hasFeature(feature)) return <>{children}</>
  if (silent) return null
  if (fallback) return <>{fallback}</>

  const requiredPlan = Object.values(PLANS).find(p =>
    (p.features as FeatureKey[]).includes(feature)
  )

  return (
    <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF2FA]">
        <Lock className="h-5 w-5 text-[#1E4A8C]" />
      </div>
      <p className="text-sm font-semibold text-[#1A1A2E]">{FEATURES[feature]}</p>
      <p className="mt-1.5 text-xs text-[#6B7280]">
        {isExpired
          ? "Votre période d'essai est terminée."
          : `Disponible à partir du plan ${requiredPlan?.name ?? 'supérieur'}.`}
      </p>
      <Link
        href="/settings/billing"
        className="mt-4 inline-flex items-center rounded-lg bg-[#1E4A8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a3f7a] transition-colors"
      >
        Voir les offres →
      </Link>
    </div>
  )
}
