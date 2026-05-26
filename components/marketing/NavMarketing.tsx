'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export function NavMarketing() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-[1600px] mx-auto px-10 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={scrolled ? '/logo-full.svg' : '/logo-white.svg'}
            alt="Talenth"
            width={140}
            height={34}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Fonctionnalités', href: '/#fonctionnalites' },
            { label: 'Comment ça marche', href: '/#fonctionnement' },
            { label: 'Tarifs', href: '/tarifs' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${scrolled ? 'text-[#6B7280]' : 'text-white/80'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? 'text-[#1E4A8C] hover:bg-[#EBF2FA]' : 'text-white/90 hover:text-white'}`}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#1E4A8C] text-white hover:bg-[#163a70] transition-colors shadow-sm"
          >
            Essai gratuit 10 jours
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-[#1A1A2E]' : 'text-white'}`}
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] px-6 py-4 space-y-3">
          {[
            { label: 'Fonctionnalités', href: '/#fonctionnalites' },
            { label: 'Comment ça marche', href: '/#fonctionnement' },
            { label: 'Tarifs', href: '/tarifs' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="block text-sm font-medium text-[#6B7280] py-1.5" onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            <Link href="/login" className="text-center text-sm font-medium text-[#1E4A8C] py-2.5 rounded-lg border border-[#1E4A8C]/20 hover:bg-[#EBF2FA]">
              Se connecter
            </Link>
            <Link href="/register" className="text-center text-sm font-semibold text-white bg-[#1E4A8C] py-2.5 rounded-lg hover:bg-[#163a70]">
              Essai gratuit 10 jours
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
