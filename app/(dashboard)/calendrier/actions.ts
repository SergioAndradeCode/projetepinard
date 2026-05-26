'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCalendarEvent(data: {
  titre: string
  description?: string
  date_evenement: string
  type: 'obligation' | 'evenement'
  establishment_id?: string | null
}): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'Organisation introuvable' }
  if (!['admin', 'charge_site'].includes(profile.role)) return { error: 'Accès refusé' }

  const { error } = await supabase.from('calendar_events').insert({
    organization_id: profile.organization_id,
    establishment_id: data.establishment_id ?? null,
    titre: data.titre,
    description: data.description ?? null,
    date_evenement: data.date_evenement,
    type: data.type,
    recurrence: null,
    est_global: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendrier')
  return {}
}

export async function deleteCalendarEvent(id: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'Organisation introuvable' }
  if (!['admin', 'charge_site'].includes(profile.role)) return { error: 'Accès refusé' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/calendrier')
  return {}
}
