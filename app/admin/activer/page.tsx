'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, AlertCircle, Building2, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLAN_LABELS: Record<string, string> = {
  essentiel:    'Essentiel',
  equipe:       'Équipe',
  organisation: 'Organisation',
}

const CYCLE_LABELS: Record<string, string> = {
  monthly:        'Mensuel',
  annual_monthly: 'Annuel mensuel',
  annual_upfront: 'Annuel en 1 paiement',
}

interface Order {
  id:                string
  invoice_number:    string
  company_name:      string
  siret:             string
  contact_firstname: string
  contact_lastname:  string
  contact_function?: string
  contact_email:     string
  plan:              string
  billing_cycle:     string
  amount_ttc:        number
  invoice_due_date:  string
  created_at:        string
  status:            string
}

type PageState = 'loading' | 'ready' | 'error' | 'done'

export default function AdminActiverPage() {
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  const [state, setState]           = useState<PageState>('loading')
  const [order, setOrder]           = useState<Order | null>(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [actionLoading, setActionLoading] = useState<'activate' | 'cancel' | null>(null)
  const [doneMsg, setDoneMsg]       = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token manquant dans l\'URL.')
      setState('error')
      return
    }
    fetch(`/api/activer?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error)
          setState('error')
        } else {
          setOrder(data.order)
          setState('ready')
        }
      })
      .catch(() => {
        setErrorMsg('Erreur réseau. Réessayez.')
        setState('error')
      })
  }, [token])

  const handleAction = async (action: 'activate' | 'cancel') => {
    setActionLoading(action)
    try {
      const res = await fetch('/api/activer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Erreur lors de l\'opération.')
        setState('error')
        return
      }
      if (action === 'activate') {
        setDoneMsg(`Compte activé. Email de bienvenue envoyé à ${data.email}.`)
      } else {
        setDoneMsg('Commande annulée.')
      }
      setState('done')
    } catch {
      setErrorMsg('Erreur réseau.')
      setState('error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold text-[#1E4A8C]">Talenth</p>
          <p className="text-xs text-[#6B7280]">Interface d&apos;activation — Accès admin</p>
        </div>

        {state === 'loading' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E4A8C] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">Vérification du lien…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-lg font-bold text-[#1A1A2E] mb-2">Lien invalide ou expiré</h1>
            <p className="text-sm text-[#6B7280]">{errorMsg}</p>
          </div>
        )}

        {state === 'done' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-lg font-bold text-[#1A1A2E] mb-2">Opération réussie</h1>
            <p className="text-sm text-[#6B7280]">{doneMsg}</p>
          </div>
        )}

        {state === 'ready' && order && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

            {/* Header card */}
            <div className="bg-[#1E4A8C] px-6 py-4">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5">Nouvelle commande</p>
              <p className="text-white font-bold text-lg">{order.company_name}</p>
              <p className="text-white/70 text-sm">{order.invoice_number}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

              {/* Entreprise */}
              <InfoBlock icon={<Building2 className="w-4 h-4" />} title="Entreprise">
                <Row label="Raison sociale" value={order.company_name} />
                <Row label="SIRET" value={order.siret} />
              </InfoBlock>

              {/* Contact */}
              <InfoBlock icon={<User className="w-4 h-4" />} title="Contact">
                <Row label="Nom" value={`${order.contact_firstname} ${order.contact_lastname}`} />
                {order.contact_function && <Row label="Fonction" value={order.contact_function} />}
                <Row label="Email" value={order.contact_email} />
              </InfoBlock>

              {/* Commande */}
              <InfoBlock icon={<CreditCard className="w-4 h-4" />} title="Commande">
                <Row label="Plan" value={PLAN_LABELS[order.plan] ?? order.plan} />
                <Row label="Facturation" value={CYCLE_LABELS[order.billing_cycle] ?? order.billing_cycle} />
                <Row label="Montant TTC" value={`${Number(order.amount_ttc).toFixed(2).replace('.', ',')} €`} bold />
                <Row label="Facture" value={order.invoice_number} />
                <Row label="Échéance" value={new Date(order.invoice_due_date).toLocaleDateString('fr-FR')} />
                <Row label="Commande le" value={new Date(order.created_at).toLocaleString('fr-FR')} />
              </InfoBlock>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => handleAction('activate')}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl"
                >
                  {actionLoading === 'activate'
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Activation…</>
                    : <><CheckCircle className="w-4 h-4 mr-2" />Activer ce compte</>
                  }
                </Button>
                <Button
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading !== null}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl"
                >
                  {actionLoading === 'cancel'
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Annulation…</>
                    : <><XCircle className="w-4 h-4 mr-2" />Annuler la commande</>
                  }
                </Button>
              </div>

              <p className="text-[11px] text-[#9CA3AF] text-center">
                Ce lien est à usage unique. L&apos;activation est irréversible.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#1E4A8C]">{icon}</span>
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{title}</p>
      </div>
      <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-xs text-[#6B7280]">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold text-[#1A1A2E]' : 'text-[#1A1A2E]'}`}>{value}</span>
    </div>
  )
}
