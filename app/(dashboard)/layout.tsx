import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { EstablishmentProvider } from '@/contexts/EstablishmentContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { TrialBanner } from '@/components/layout/TrialBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let orgName: string | undefined
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    orgName = org?.name
  }

  return (
    <ProfileProvider profile={profile ?? null}>
    <SubscriptionProvider organizationId={profile?.organization_id ?? null}>
      <EstablishmentProvider>
        <div className="min-h-screen bg-[#F8FAFC]">
          <Sidebar profile={profile} orgName={orgName} />
          <div className="lg:ml-[240px] flex flex-col min-h-screen">
            <TrialBanner />
            <Header />
            <main className="flex-1 p-6 pb-24 lg:pb-6">
              {children}
            </main>
          </div>
          <MobileNav />
        </div>
      </EstablishmentProvider>
    </SubscriptionProvider>
    </ProfileProvider>
  )
}
