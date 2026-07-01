import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programme bêta — Talenth.fr',
  description: "Rejoignez les 5 entreprises qui testent Talenth.fr en avant-première et obtenez l'abonnement annuel divisé par 2.",
  robots: 'noindex',
}

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
