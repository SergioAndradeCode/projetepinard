'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie } from 'lucide-react'

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // N'afficher que si l'utilisateur n'a pas encore fermé la notice
    const dismissed = localStorage.getItem('talenth_cookie_notice_v1')
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('talenth_cookie_notice_v1', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1F3C] text-white px-4 py-3 md:py-4"
    >
      <div className="max-w-[1600px] mx-auto flex items-center gap-4 flex-wrap md:flex-nowrap">
        {/* Icône */}
        <Cookie className="w-5 h-5 shrink-0 text-white/60 hidden md:block" />

        {/* Message */}
        <p className="text-sm text-white/80 flex-1 leading-relaxed">
          Ce site utilise uniquement des <strong className="text-white font-semibold">cookies techniques strictement nécessaires</strong>{' '}
          au fonctionnement du service (authentification, session).{' '}
          <strong className="text-white font-semibold">Aucun cookie publicitaire ni analytique</strong> n&apos;est déposé.{' '}
          <Link href="/confidentialite#cookies" className="underline text-white/70 hover:text-white transition-colors text-xs">
            En savoir plus
          </Link>
        </p>

        {/* Bouton fermer */}
        <button
          onClick={dismiss}
          aria-label="Fermer la notice cookies"
          className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium px-4 py-2 rounded-lg"
        >
          <span>J&apos;ai compris</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
