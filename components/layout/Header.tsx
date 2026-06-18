'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Tableau de bord', description: "Vue d'ensemble de votre conformité OETH" },
  '/rqth': { title: 'Salariés RQTH', description: 'Gérez les reconnaissances de vos collaborateurs' },
  '/esat': { title: 'Achats ESAT/EA', description: 'Suivez vos achats auprès du secteur adapté' },
  '/calendrier': { title: 'Calendrier', description: 'Obligations légales et événements OETH' },
  '/budget': { title: 'Budget OETH', description: 'Suivi des dépenses et allocations budgétaires' },
  '/parametres': { title: 'Paramètres', description: 'Configuration de votre entreprise' },
  '/equipe': { title: 'Équipe', description: 'Gérez les accès de vos collaborateurs' },
  '/etablissements': { title: 'Établissements', description: 'Gérez vos sites et leurs paramètres OETH' },
  '/doeth': { title: 'Assistant DOETH', description: 'Préparez votre déclaration annuelle' },
  '/guide': { title: 'Guide OETH', description: 'Comprendre l\'obligation, les calculs et la déclaration DSN' },
}

export function Header() {
  const pathname = usePathname()
  const page = PAGE_TITLES[pathname] ?? { title: 'Talenth', description: '' }

  return (
    <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur border-b border-[#E2E8F0] px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-[#1A1A2E] truncate">{page.title}</h1>
        {page.description && (
          <p className="text-sm text-[#6B7280] mt-0.5">{page.description}</p>
        )}
      </div>
    </header>
  )
}
