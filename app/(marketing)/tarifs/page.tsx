import Link from 'next/link'
import { CheckCircle, ArrowRight, HelpCircle, UserPlus, PlayCircle, CreditCard } from 'lucide-react'
import { TarifsGrid } from '@/components/marketing/TarifsGrid'
import { FEATURES } from '@/lib/plans'

export const metadata = {
  title: 'Tarifs | Talenth',
  description: 'Des tarifs simples et transparents pour gérer votre conformité OETH. Essai gratuit 10 jours, sans carte bancaire. Tous les tarifs sont affichés hors taxes (HT).',
}

const FAQ = [
  {
    q: 'L\'essai gratuit est-il vraiment sans engagement ?',
    a: 'Oui. 10 jours complets, sans carte bancaire. À l\'issue de la période d\'essai, vous choisissez un plan ou votre compte passe en lecture seule. Aucun prélèvement automatique.',
  },
  {
    q: 'Toutes les fonctionnalités sont-elles vraiment incluses dans chaque plan ?',
    a: 'Oui, sans exception. Quel que soit votre plan, vous accédez à l\'intégralité de Talenth : tableau de bord OETH, suivi BOETH, maintien dans l\'emploi, DOETH, budget, achats ESAT, exports Excel et gestion d\'équipe. La seule différence entre les plans est le nombre d\'utilisateurs.',
  },
  {
    q: 'Quelle est la différence entre « Annuel 1 paiement » et « Annuel mensuel » ?',
    a: 'Les deux formules offrent la même remise de 15% par rapport au mensuel sans engagement. La différence est uniquement dans la façon dont vous payez : « Annuel 1 paiement » génère une seule facture pour l\'année entière (idéal pour les entreprises fonctionnant par bon de commande ou virement bancaire), tandis qu\'« Annuel mensuel » vous prélève chaque mois sur 12 mois avec engagement annuel.',
  },
  {
    q: 'Est-il possible de payer par bon de commande ou virement bancaire ?',
    a: 'Oui, l\'option « Annuel en 1 fois » est spécialement conçue pour les organisations qui fonctionnent par bon de commande. Après votre essai gratuit, sélectionnez cette formule lors du paiement : Stripe accepte la carte bancaire et le virement SEPA. Pour un processus de devis/bon de commande formalisé, contactez-nous à contact@talenth.fr.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez monter ou descendre de plan depuis la page Paramètres › Facturation. La différence de tarif est proratisée au jour près.',
  },
  {
    q: 'Les données sont-elles sécurisées ?',
    a: 'Vos données sont hébergées en France, chiffrées en transit et au repos. Talenth est conforme au RGPD. Vous restez propriétaire de vos données et pouvez les exporter à tout moment.',
  },
  {
    q: 'Quel plan choisir pour un cabinet RH gérant plusieurs entreprises clientes ?',
    a: 'Le plan Groupe est fait pour vous. Contactez-nous à contact@talenth.fr pour une offre personnalisée adaptée à votre activité multi-clients.',
  },
]

export default function TarifsPage() {
  return (
    <div className="pt-24 pb-20">

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-4">Tarifs</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-5 leading-tight">
            Un seul outil, complet.<br />Choisissez la taille de votre équipe.
          </h1>
          <p className="text-[#6B7280] text-lg leading-relaxed mb-6">
            Toutes les fonctionnalités sont incluses dans chaque plan.
            Seul le nombre d&apos;utilisateurs diffère.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-[#6B7280] bg-[#FEFCF8] border border-[#F0EBE3] px-4 py-2 rounded-full">
            <CheckCircle className="w-4 h-4 text-[#D97706]" />
            10 jours d&apos;essai gratuit · Sans carte bancaire · Annulable à tout moment
          </div>
        </div>
      </section>

      {/* Bannière HT + comment souscrire */}
      <section className="max-w-4xl mx-auto px-6 mb-10">
        <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-2xl p-6">
          <p className="text-xs font-bold text-[#1E4A8C] uppercase tracking-widest mb-4">Comment souscrire</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: UserPlus,    step: '1', title: 'Créez votre compte', desc: 'Essai gratuit 10 jours, sans carte bancaire. Votre espace est opérationnel en 5 minutes.' },
              { icon: PlayCircle,  step: '2', title: 'Explorez Talenth', desc: 'Configurez vos établissements, importez vos données, découvrez toutes les fonctionnalités.' },
              { icon: CreditCard,  step: '3', title: 'Activez votre abonnement', desc: 'Depuis votre espace, onglet Paramètres > Abonnement. Paiement par carte ou virement bancaire.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1E4A8C] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {step}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-[#1E4A8C]" />
                    <p className="text-sm font-semibold text-[#1A1A2E]">{title}</p>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-[#9CA3AF] mt-3">
          Tous les tarifs ci-dessous sont affichés <strong className="text-[#6B7280]">hors taxes (HT)</strong>. TVA 20% applicable.
        </p>
      </section>

      {/* Plans grid — mode informatif uniquement */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <TarifsGrid infoOnly />
      </section>

      {/* Tout inclus, liste complète */}
      <section className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-[#FEFCF8] border border-[#F0EBE3] rounded-3xl p-10">
          <h2 className="text-2xl font-black text-[#1A1A2E] mb-2 text-center">
            Tout est inclus. Dans chaque plan.
          </h2>
          <p className="text-[#6B7280] text-center mb-8 text-sm">
            Pas de modules optionnels, pas de surprises : voici ce que vous obtenez dès le premier jour.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.values(FEATURES) as string[]).map((label) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-[#F0EBE3] rounded-xl px-4 py-3 shadow-sm">
                <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="text-sm text-[#1A1A2E] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-gradient-to-br from-[#0F1F3A] to-[#1E4A8C] rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl font-black mb-3">
            Prêts à donner à votre mission handicap les outils qu&apos;elle mérite ?
          </h2>
          <p className="text-white/70 leading-relaxed max-w-2xl mx-auto mb-2">
            Créez votre compte gratuit en 2 minutes. Votre abonnement se choisit ensuite directement depuis votre espace, dans l&apos;onglet <strong className="text-white">Paramètres &rsaquo; Abonnement</strong>.
          </p>
          <p className="text-white/50 text-xs mb-8">
            Paiement par carte bancaire ou virement bancaire sur facture. Activation immédiate ou sous 24h ouvrées.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-white font-bold px-7 py-3 rounded-xl hover:bg-[#D97706] transition-colors text-sm"
            >
              Créer mon compte gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-white/20 text-white font-medium px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8">
          <HelpCircle className="w-5 h-5 text-[#1E4A8C]" />
          <h2 className="text-2xl font-black text-[#1A1A2E]">Questions fréquentes</h2>
        </div>

        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-[#FEFCF8] rounded-2xl border border-[#F0EBE3] p-6">
              <p className="font-semibold text-[#1A1A2E] mb-2">{q}</p>
              <p className="text-sm text-[#6B7280] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#6B7280] text-sm mb-3">Une autre question ?</p>
          <a href="mailto:contact@talenth.fr" className="text-[#1E4A8C] font-semibold text-sm hover:underline">
            Écrivez-nous à contact@talenth.fr →
          </a>
        </div>
      </section>
    </div>
  )
}
