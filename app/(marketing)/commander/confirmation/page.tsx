'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ChevronDown, ArrowLeft } from 'lucide-react'

const FAQ = [
  {
    q: 'Je n\'ai pas reçu l\'email avec la facture ?',
    a: 'Vérifiez votre dossier spam ou courrier indésirable. Si vous ne le trouvez pas sous 10 minutes, contactez-nous à contact@talenth.fr en indiquant votre numéro de facture.',
  },
  {
    q: 'Puis-je payer par bon de commande ?',
    a: 'Oui. Indiquez simplement votre numéro de bon de commande dans le libellé du virement. Notre équipe rapprochera les documents. Si vous avez besoin d\'un devis formel, contactez-nous.',
  },
  {
    q: 'Combien de temps pour l\'activation de mon accès ?',
    a: 'Votre accès est activé sous 24h ouvrées après réception de votre virement. Vous recevrez un email de confirmation avec vos identifiants de connexion.',
  },
]

function ConfirmationPageInner() {
  const params      = useSearchParams()
  const invoice     = params.get('invoice') ?? ''
  const planName    = params.get('plan')    ?? ''
  const ttcStr      = params.get('ttc')     ?? '0'
  const email       = params.get('email')   ?? ''
  const ttc         = parseFloat(ttcStr)

  const maskedEmail = email.includes('@')
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : email

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">

        {/* Succès */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1A2E] mb-3">
            Votre commande est bien enregistrée !
          </h1>
          <p className="text-[#6B7280] leading-relaxed max-w-lg mx-auto">
            Vous allez recevoir votre facture par email dans quelques instants
            {maskedEmail && <> à l&apos;adresse <strong className="text-[#1A1A2E]">{maskedEmail}</strong></>}.
            Effectuez votre virement en indiquant la référence de la facture.
            Votre accès Talenth sera activé <strong>sous 24h ouvrées</strong>.
          </p>
        </div>

        {/* Récap commande */}
        {invoice && (
          <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-2xl p-6 mb-8">
            <p className="text-xs font-bold text-[#1E4A8C] uppercase tracking-wider mb-4">Récapitulatif</p>
            <div className="space-y-2">
              {[
                ['N° de facture', invoice],
                ['Plan',          planName],
                ['Montant TTC',   `${ttc.toFixed(2).replace('.', ',')} €`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-[#6B7280]">{label}</span>
                  <span className="font-semibold text-[#1A1A2E]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1E4A8C]/15 text-xs text-[#6B7280]">
              La facture complète avec les coordonnées bancaires vous a été envoyée par email.
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mb-8">
          <p className="text-sm font-bold text-[#1A1A2E] mb-3">Questions fréquentes</p>
          <div className="space-y-2">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-[#1A1A2E]">{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6B7280] transition-transform shrink-0 ml-2 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() { return <Suspense><ConfirmationPageInner /></Suspense> }
