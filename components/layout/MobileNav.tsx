'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, Calendar, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/rqth', icon: Users, label: 'RQTH' },
  { href: '/esat', icon: Building2, label: 'ESAT' },
  { href: '/calendrier', icon: Calendar, label: 'Agenda' },
  { href: '/guide', icon: BookOpen, label: 'Guide' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]',
                active ? 'text-[#1E4A8C]' : 'text-[#6B7280]'
              )}
            >
              <item.icon className={cn('w-5 h-5', active ? 'text-[#1E4A8C]' : 'text-[#6B7280]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
