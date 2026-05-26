import { NavMarketing } from '@/components/marketing/NavMarketing'
import { FooterMarketing } from '@/components/marketing/FooterMarketing'
import { CookieNotice } from '@/components/marketing/CookieNotice'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavMarketing />
      <main className="flex-1">{children}</main>
      <FooterMarketing />
      <CookieNotice />
    </div>
  )
}
