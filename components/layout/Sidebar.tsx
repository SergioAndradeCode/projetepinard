'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, Calendar, Settings,
  UserCog, LogOut, Wallet, FileCheck, BookOpen, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Tableau de bord', roles: ['admin', 'charge_site', 'charge_mission', 'lecteur'] },
  { href: '/rqth',       icon: Users,            label: 'Salariés RQTH',  roles: ['admin', 'charge_site', 'charge_mission', 'lecteur'] },
  { href: '/esat',       icon: Building2,        label: 'Achats ESAT/EA', roles: ['admin', 'charge_site', 'charge_mission', 'lecteur'] },
  { href: '/calendrier', icon: Calendar,         label: 'Calendrier',     roles: ['admin', 'charge_site', 'charge_mission', 'lecteur'] },
  { href: '/budget',     icon: Wallet,           label: 'Budget',          roles: ['admin', 'charge_site', 'charge_mission'] },
  { href: '/guide',      icon: BookOpen,         label: 'Guide OETH',      roles: ['admin', 'charge_site', 'charge_mission', 'lecteur'] },
]

const adminItems = [
  { href: '/doeth',            icon: FileCheck,  label: 'Assistant DOETH',  roles: ['admin'] },
  { href: '/etablissements',   icon: Building2,  label: 'Établissements',   roles: ['admin'] },
  { href: '/equipe',           icon: UserCog,    label: 'Équipe',           roles: ['admin', 'charge_site', 'charge_mission'] },
  { href: '/parametres',       icon: Settings,   label: 'Paramètres',       roles: ['admin', 'charge_site', 'charge_mission'] },
  { href: '/settings/billing', icon: CreditCard, label: 'Abonnement',       roles: ['admin'] },
]

interface SidebarProps {
  profile: Profile | null
  orgName?: string
}

function normalizeRole(role: string | undefined): 'admin' | 'charge_site' | 'lecteur' {
  if (role === 'admin') return 'admin'
  if (role === 'referent' || role === 'charge_site' || role === 'charge_mission') return 'charge_site'
  return 'lecteur'
}

export function Sidebar({ profile, orgName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const role = normalizeRole(profile?.role)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnecté')
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  const roleLabelMap: Record<string, string> = {
    admin:          'Administrateur',
    charge_site:    'Référent(e) Handicap',
    charge_mission: 'Chargé(e) de Mission',
    lecteur:        'Lecteur',
  }
  const roleLabel = roleLabelMap[profile?.role ?? ''] ?? 'Lecteur'

  const renderNavItem = (item: typeof navItems[0]) => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-[#EBF2FA] text-[#1E4A8C]'
            : 'text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#1A1A2E]'
        )}
      >
        <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#1E4A8C]' : 'text-[#6B7280]')} />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#E2E8F0] z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E4A8C] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <span className="text-[18px] font-bold text-[#1E4A8C]">Talenth</span>
            {orgName && (
              <p className="text-[11px] text-[#6B7280] truncate max-w-[140px]">{orgName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => item.roles.includes(role))
          .map((item) => renderNavItem(item))}

        {/* Section administration */}
        {adminItems.some(item => item.roles.includes(role)) && (
          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest">
              Administration
            </p>
          </div>
        )}

        {adminItems
          .filter(item => item.roles.includes(role))
          .map((item) => renderNavItem(item))}
      </nav>

      {/* Profil + déconnexion */}
      <div className="p-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#EBF2FA] flex items-center justify-center shrink-0">
            <span className="text-[#1E4A8C] text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1A1A2E] truncate">
              {profile?.full_name ?? 'Utilisateur'}
            </p>
            <p className="text-xs text-[#6B7280]">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-red-50 hover:text-[#B71C1C] transition-colors mt-1"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
