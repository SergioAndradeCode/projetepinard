import Link from 'next/link'
import { CheckCircle, ArrowRight, HelpCircle } from 'lucide-react'
import { TarifsGrid } from '@/components/marketing/TarifsGrid'
import { FEATURES } from '@/lib/plans'

export const metadata = {
  title: 'Tarifs — Talenth',
  description: 'Des tarifs simples et transparents pour gérer votre conformité OETH. Essai gratuit 10 jours, sans carte bancaire.',
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
    q: 'Qu\'est-ce que l\'abonnement annuel mensuel ?',
    a: 'Vous êtes prélevé chaque mois mais vous vous engagez sur 12 mois. En contrepartie, vous bénéficiez de 15% de réduction par rapport au mensuel sans engagement. Vous pouvez annuler avant le renouvellement annuel.',
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

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <TarifsGrid />
      </section>

      {/* Tout inclus — liste complète */}
      <section className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-[#FEFCF8] border border-[#F0EBE3] rounded-3xl p-10">
          <h2 className="text-2xl font-black text-[#1A1A2E] mb-2 text-center">
            Tout est inclus. Dans chaque plan.
          </h2>
          <p className="text-[#6B7280] text-center mb-8 text-sm">
            Pas de modules optionnels, pas de surprises — voici ce que vous obtenez dès le premier jour.
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
          <p className="text-white/70 leading-relaxed max-w-2xl mx-auto mb-6">
            10 jours d&apos;essai gratuit, sans carte bancaire. Opérationnel en moins de 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-white font-bold px-7 py-3 rounded-xl hover:bg-[#D97706] transition-colors text-sm"
            >
              Commencer l&apos;essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:contact@talenth.fr?subject=Question tarifs Talenth"
              className="inline-flex items-center justify-center border border-white/20 text-white font-medium px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Nous contacter
            </a>
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
