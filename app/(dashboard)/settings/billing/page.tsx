'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Loader2, ExternalLink, Zap, Shield, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { PLANS, FEATURES, type BillingCycle, type FeatureKey, type PlanId } from '@/lib/plans'

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly:        'Mensuel',
  annual_monthly: 'Annuel mensuel',
  annual_upfront: 'Annuel — 1 paiement',
}

const CYCLE_DISCOUNT: Record<BillingCycle, string | null> = {
  monthly:        null,
  annual_monthly: '−15%',
  annual_upfront: '−15%',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing:   { label: 'Essai gratuit',  color: 'bg-blue-100 text-blue-700' },
  active:     { label: 'Actif',          color: 'bg-green-100 text-green-700' },
  past_due:   { label: 'Paiement en retard', color: 'bg-orange-100 text-orange-700' },
  canceled:   { label: 'Résilié',        color: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet',      color: 'bg-gray-100 text-gray-700' },
}

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  essentiel:    <Zap className="w-5 h-5" />,
  equipe:       <Shield className="w-5 h-5" />,
  organisation: <Building2 className="w-5 h-5" />,
  groupe:       <Users className="w-5 h-5" />,
}

export default function BillingPage() {
  const { planId, billingCycle, status, currentPeriodEnd, isTrialing, trialEndsAt, refetch } = useSubscription()
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('annual_upfront')
  const [loadingPlan, setLoadingPlan]     = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [syncing, setSyncing]             = useState(false)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const syncDone     = useRef(false)

  // ── Synchronisation après retour du checkout Stripe ──────────────────────
  useEffect(() => {
    if (syncDone.current) return
    const isSuccess = searchParams.get('success') === '1'
    const sessionId = searchParams.get('session_id')

    if (!isSuccess) {
      if (searchParams.get('canceled') === '1') toast.info('Paiement annulé.')
      return
    }

    syncDone.current = true

    if (sessionId) {
      // Chemin nominal : synchronise directement depuis Stripe (contourne le webhook)
      setSyncing(true)
      fetch('/api/stripe/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            toast.success('Abonnement activé — bienvenue !')
            refetch()
          } else {
            toast.error(data.error ?? 'Erreur de synchronisation')
          }
        })
        .catch(() => toast.error('Erreur réseau'))
        .finally(() => setSyncing(false))
    } else {
      // Fallback : attend 2 s que le webhook ait eu le temps de s'exécuter
      toast.success('Abonnement activé — bienvenue !')
      setTimeout(() => refetch(), 2000)
    }

    // Nettoie l'URL sans rechargement
    router.replace('/settings/billing', { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCheckout = async (targetPlanId: PlanId) => {
    setLoadingPlan(targetPlanId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlanId, billingCycle: selectedCycle }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Erreur lors de la création de la session')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handlePortal = async () => {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Erreur lors de l\'ouverture du portail')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoadingPortal(false)
    }
  }

  const statusInfo = status ? STATUS_LABELS[status] : null

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Abonnement</h1>
        <p className="text-sm text-[#6B7280] mt-1">Gérez votre plan Talenth et vos informations de paiement</p>
      </div>

      {syncing && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Activation de votre abonnement en cours…
        </div>
      )}

      {/* Statut actuel */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  Plan actuel : <span className="text-[#1E4A8C]">{planId ? PLANS[planId].name : 'Aucun'}</span>
                </p>
                {statusInfo && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              {billingCycle && (
                <p className="text-xs text-[#6B7280]">Facturation : {CYCLE_LABELS[billingCycle]}</p>
              )}
              {currentPeriodEnd && status === 'active' && (
                <p className="text-xs text-[#6B7280]">
                  Prochain renouvellement : {currentPeriodEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              {isTrialing && trialEndsAt && (
                <p className="text-xs text-[#BF5A00] font-medium">
                  Essai jusqu&apos;au {trialEndsAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            {planId && (
              <Button variant="secondary" className="gap-2 shrink-0" onClick={handlePortal} disabled={loadingPortal}>
                {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Gérer mon abonnement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sélecteur de cycle */}
      <div>
        <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Choisissez votre cycle de facturation</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(CYCLE_LABELS) as [BillingCycle, string][]).map(([cycle, label]) => (
            <button
              key={cycle}
              onClick={() => setSelectedCycle(cycle)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all border ${
                selectedCycle === cycle
                  ? 'bg-[#EBF2FA] border-[#1E4A8C]/40 text-[#1E4A8C]'
                  : 'bg-white border-[#E2E8F0] text-[#6B7280] hover:bg-[#F8FAFC]'
              }`}
            >
              {label}
              {CYCLE_DISCOUNT[cycle] && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedCycle === cycle ? 'bg-[#1E4A8C] text-white' : 'bg-green-100 text-green-700'}`}>
                  {CYCLE_DISCOUNT[cycle]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des plans — 3 plans standards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][])
          .filter(([id]) => id !== 'groupe')
          .map(([id, plan]) => {
          const price = plan.prices[selectedCycle]
          const isCurrentPlan = planId === id
          const amount = price.amount

          return (
            <div
              key={id}
              className={`relative rounded-xl border-2 p-5 flex flex-col transition-all ${
                isCurrentPlan
                  ? 'border-[#1E4A8C] bg-[#EBF2FA]'
                  : id === 'equipe'
                    ? 'border-[#1E4A8C]/40 bg-white shadow-sm'
                    : 'border-[#E2E8F0] bg-white'
              }`}
            >
              {id === 'equipe' && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">RECOMMANDÉ</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${isCurrentPlan ? 'bg-[#1E4A8C] text-white' : 'bg-[#EBF2FA] text-[#1E4A8C]'}`}>
                  {PLAN_ICONS[id]}
                </div>
                <p className="font-bold text-[#1A1A2E]">{plan.name}</p>
              </div>

              <div className="mb-4">
                {selectedCycle === 'annual_upfront' ? (
                  <>
                    <span className="text-3xl font-extrabold text-[#1A1A2E]">
                      {(amount / 100).toFixed(0)}€
                    </span>
                    <span className="text-sm text-[#6B7280]">/an</span>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      1 paiement · 12 mois d&apos;accès
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      Soit {Math.round(amount / 100 / 12)}€/mois effectif
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-[#1A1A2E]">
                      {(amount / 100).toFixed(0)}€
                    </span>
                    <span className="text-sm text-[#6B7280]">/mois</span>
                    {selectedCycle === 'annual_monthly' && (
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Engagement 12 mois · paiement mensuel
                      </p>
                    )}
                  </>
                )}
              </div>

              <ul className="space-y-1.5 mb-5 flex-1">
                <li className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <Building2 className="w-3.5 h-3.5 text-[#1E4A8C] shrink-0" />
                  {plan.maxEstablishments === -1 ? 'Établissements illimités' : `${plan.maxEstablishments} établissement${plan.maxEstablishments > 1 ? 's' : ''}`}
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <Users className="w-3.5 h-3.5 text-[#1E4A8C] shrink-0" />
                  {plan.maxUsers === -1 ? 'Utilisateurs illimités' : `${plan.maxUsers} utilisateur${plan.maxUsers > 1 ? 's' : ''}`}
                </li>
                {plan.features.slice(0, 4).map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#6B7280]">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {FEATURES[f as FeatureKey]}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-xs text-[#1E4A8C] font-medium pl-5">
                    + {plan.features.length - 4} fonctionnalités
                  </li>
                )}
              </ul>

              <Button
                onClick={() => handleCheckout(id)}
                disabled={isCurrentPlan || !!loadingPlan}
                variant={isCurrentPlan ? 'secondary' : 'default'}
                className="w-full"
              >
                {isCurrentPlan ? (
                  'Plan actuel'
                ) : loadingPlan === id ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Chargement…</>
                ) : (
                  'Choisir ce plan'
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Bannière Groupe */}
      <div className="rounded-xl border border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-[#EBF2FA] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-[#EBF2FA] text-[#1E4A8C] shrink-0">
            {PLAN_ICONS['groupe']}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-[#1A1A2E] text-sm">Groupe</p>
              {planId === 'groupe' && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Plan actuel</span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Plus de 15 utilisateurs · Multi-entités · Cabinets RH — tarif sur mesure, facturation adaptée à votre organisation.
            </p>
          </div>
        </div>
        <a
          href="mailto:contact@talenth.fr?subject=Offre Groupe Talenth — demande de devis"
          className="flex items-center gap-2 bg-[#1E4A8C] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#163870] transition-colors text-sm whitespace-nowrap shrink-0"
        >
          Demander un devis
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Note TVA */}
      <p className="text-xs text-[#6B7280] text-center">
        Tarifs HT — TVA 20% applicable. Paiement par carte bancaire ou prélèvement SEPA.
        Factures PDF disponibles dans l&apos;espace client Stripe.
      </p>
    </div>
  )
}
