import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://talenth.fr'),
  title: {
    default: "Talenth | Logiciel OETH - Pilotage de l'Obligation d'Emploi des Travailleurs Handicapes",
    template: '%s | Talenth',
  },
  description: "Talenth, le logiciel OETH concu pour les equipes RH. Tableau de bord OETH, suivi BOETH, calcul unites beneficiaires, DOETH et gestion mission handicap en un seul outil.",
  keywords: [
    'logiciel OETH', 'pilotage OETH', 'suivi BOETH', 'logiciel mission handicap',
    'calcul unites beneficiaires', 'tableau de bord OETH', 'DOETH',
    'obligation emploi travailleurs handicapes', 'AGEFIPH', 'RQTH',
    'pilotage RH handicap', 'conformite OETH', 'logiciel RH handicap',
  ],
  authors: [{ name: 'Talenth', url: 'https://talenth.fr' }],
  creator: 'Talenth',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://talenth.fr',
    siteName: 'Talenth',
    title: "Talenth | Logiciel OETH - Pilotage OETH pour les equipes RH",
    description: "Tableau de bord OETH, suivi BOETH, calcul unites beneficiaires et DOETH en un seul outil. Essai gratuit 10 jours.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Talenth - Logiciel OETH' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talenth | Logiciel OETH - Pilotage OETH',
    description: "Tableau de bord OETH, suivi BOETH, calcul unites beneficiaires et DOETH en un seul outil.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
