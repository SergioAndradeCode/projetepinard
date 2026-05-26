import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendrierWrapper } from '@/components/calendrier/CalendrierWrapper'

export default async function CalendrierPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        <p>Aucune organisation associée à ce compte.</p>
      </div>
    )
  }

  const [
    { data: evenementsOrg },
    { data: salaries },
    { data: establishments },
  ] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('date_evenement'),
    supabase
      .from('rqth_employees')
      .select('*')
      .eq('organization_id', profile.organization_id),
    supabase
      .from('establishments')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('is_headquarters', { ascending: false })
      .order('name'),
  ])

  const canWrite = ['admin', 'charge_site'].includes(profile.role)

  return (
    <div className="max-w-3xl">
      <CalendrierWrapper
        evenementsOrg={evenementsOrg ?? []}
        salaries={salaries ?? []}
        establishments={establishments ?? []}
        canWrite={canWrite}
      />
    </div>
  )
}
