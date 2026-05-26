import Link from 'next/link'
import Image from 'next/image'
import { Mail, Shield } from 'lucide-react'

export function FooterMarketing() {
  return (
    <footer className="bg-[#0D1F3C] text-white">
      <div className="max-w-[1600px] mx-auto px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Image src="/logo-white.svg" alt="Talenth" width={130} height={32} />
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              La plateforme de gestion de l&apos;obligation d&apos;emploi des travailleurs handicapés (OETH) pensée pour les RH et cabinets spécialisés.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Shield className="w-3.5 h-3.5" />
              <span>Données hébergées en France · Conforme RGPD</span>
            </div>
          </div>

          {/* Produit */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Produit</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Fonctionnalités', href: '/#fonctionnalites' },
                { label: 'Tarifs', href: '/tarifs' },
                { label: 'Comment ça marche', href: '/#fonctionnement' },
                { label: 'Accéder à l\'outil', href: '/login' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal & contact */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Contact</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Mentions légales', href: '/mentions-legales' },
                { label: 'Politique de confidentialité', href: '/confidentialite' },
                { label: 'CGV / CGU', href: '/cgv' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:contact@talenth.fr" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  contact@talenth.fr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Talenth. Tous droits réservés.</span>
          <span>Données hébergées en UE · Conforme RGPD · TVA applicable</span>
        </div>
      </div>
    </footer>
  )
}
