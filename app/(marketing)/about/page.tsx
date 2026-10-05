import type { Metadata } from 'next'
import Link from 'next/link'
import { NavMarketing } from '@/components/marketing/NavMarketing'
import { FooterMarketing } from '@/components/marketing/FooterMarketing'

export const metadata: Metadata = {
  title: 'À propos',
  description: "Découvrez l'équipe derrière Talenth.fr : Sergio De Andrade, fondateur, et Zippytal, partenaire technique. Un outil construit avec intention pour les équipes mission handicap.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavMarketing />

      {/* ── HEADER ── */}
      <section className="relative bg-[#0F1F3A] pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0f00]/20 via-transparent to-[#0a1a30]/60 pointer-events-none" />
        <div className="absolute top-10 left-[15%] w-96 h-96 rounded-full bg-[#F59E0B]/5 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-4">L&apos;équipe</p>
          <h1 className="text-4xl xl:text-5xl font-black text-white mb-6 leading-tight">
            Des personnes engagées,<br />un outil construit avec intention.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Talenth.fr est né du terrain. Voici l&apos;équipe qui le conçoit, le développe et le maintient au quotidien.
          </p>
        </div>
      </section>

      {/* ── TALENTH ── */}
      <section className="py-20 bg-[#FEFCF8]">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-4 text-center">Le projet</p>
          <h2 className="text-2xl font-black text-[#1A1A2E] mb-6 text-center">Pourquoi Talenth.fr ?</h2>
          <p className="text-[#4B5563] text-base leading-relaxed mb-4">
            Les équipes mission handicap jonglent chaque année avec des calculs complexes, des situations individuelles à suivre, des déclarations DOETH à produire et des budgets à piloter. Dans la plupart des entreprises, tout cela repose encore sur des fichiers Excel faits maison, mis à jour manuellement, souvent différents d&apos;un établissement à l&apos;autre.
          </p>
          <p className="text-[#4B5563] text-base leading-relaxed">
            Talenth.fr est né de ce constat. Un outil unique, pensé pour les référents handicap et chargés de mission, qui centralise le suivi des collaborateurs BOETH, les calculs d&apos;unités bénéficiaires, le maintien dans l&apos;emploi, la gestion budgétaire et la préparation de la DOETH. Simple à prendre en main, conforme aux règles AGEFIPH, mis à jour chaque année.
          </p>
        </div>
      </section>

      {/* ── L'ÉQUIPE ── */}
      <section className="py-20 bg-[#0F1F3A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0f00]/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-20 right-[5%] w-80 h-80 rounded-full bg-[#1E4A8C]/10 blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Sergio */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-white/8 transition-colors">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#F59E0B]/30 flex-shrink-0">
                  <img
                    src="/founder.jpeg"
                    alt="Sergio De Andrade"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-0.5">Sergio De Andrade</h3>
                  <p className="text-[#F59E0B] text-sm font-medium">Fondateur de Talenth.fr</p>
                </div>
              </div>
              <p className="text-white/60 text-base leading-relaxed flex-1 mb-7">
                J&apos;ai construit Talenth.fr parce que j&apos;ai vu des équipes mission handicap passer des heures sur Excel à recalculer leur OETH chaque année. Mon objectif : un outil simple, fiable, centré sur les personnes, pas sur la conformité seule. Je réponds personnellement à chaque message.
              </p>
              <a
                href="https://www.linkedin.com/in/sergio-de-andrade-748334195/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#0958a8] transition-colors self-start"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Me retrouver sur LinkedIn
              </a>
            </div>

            {/* Zippytal */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-white/8 transition-colors">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src="/zippytal-logo.jpg"
                    alt="Zippytal"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-0.5">Zippytal</h3>
                  <p className="text-[#5DCAA5] text-sm font-medium">Partenaire technique</p>
                </div>
              </div>
              <p className="text-white/60 text-base leading-relaxed flex-1 mb-7">
                Zippytal connecte les outils existants pour créer des flux de travail automatisés : acquisition clients, relances commerciales, suivi de dossiers, coordination d&apos;équipe, sans ressaisie. Ensemble, nous formons l&apos;équipe qui conçoit et maintient Talenth.fr.
              </p>
              <a
                href="https://zippytal.com/en"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition-colors self-start"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Découvrir Zippytal
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white border-t border-[#E2E8F0] text-center">
        <div className="max-w-xl mx-auto px-6">
          <p className="text-[#6B7280] text-base mb-6">Vous voulez tester Talenth.fr ? 10 jours gratuits, sans carte bancaire.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#1E4A8C] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#163a70] transition-colors text-sm shadow-sm"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <FooterMarketing />
    </div>
  )
}
