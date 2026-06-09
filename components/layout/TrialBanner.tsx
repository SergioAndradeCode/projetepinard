'use client'

import Link from 'next/link'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { AlertTriangle, Zap } from 'lucide-react'

export function TrialBanner() {
  const { isTrialing, isExpired, trialEndsAt } = useSubscription()

  if (!isTrialing && !isExpired) return null

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 bg-[#B71C1C] px-4 py-2.5 text-sm text-white">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Votre période d&apos;essai est terminée, l&apos;accès aux fonctionnalités est limité.</span>
        <Link href="/settings/billing" className="ml-2 underline font-semibold hover:text-white/80">
          Choisir un plan →
        </Link>
      </div>
    )
  }

  if (isTrialing && trialEndsAt) {
    const msLeft = trialEndsAt.getTime() - Date.now()
    const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)))
    const urgent = daysLeft <= 3

    return (
      <div className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white ${urgent ? 'bg-[#BF5A00]' : 'bg-[#1E4A8C]'}`}>
        <Zap className="w-4 h-4 shrink-0" />
        <span>
          Période d&apos;essai, encore{' '}
          <strong>{daysLeft} jour{daysLeft !== 1 ? 's' : ''}</strong> (jusqu&apos;au{' '}
          {trialEndsAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}).
        </span>
        <Link href="/settings/billing" className="ml-2 underline font-semibold hover:text-white/80">
          Passer à un plan payant →
        </Link>
      </div>
    )
  }

  return null
}
