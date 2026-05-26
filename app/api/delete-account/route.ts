import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    // Récupérer l'org de l'utilisateur avant suppression
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    // Supprimer le profil (cascade via FK vers les données de l'org si seul admin)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Si l'utilisateur est admin, marquer l'organisation comme annulée
    // (les données restent 30 jours avant purge manuelle, conformément à la politique de confidentialité)
    if (profile?.organization_id && profile.role === 'admin') {
      await supabase
        .from('organizations')
        .update({ subscription_status: 'canceled' })
        .eq('id', profile.organization_id)
    }

    // Supprimer l'utilisateur auth via le client admin (service role)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminSupabase.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
