import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, establishment_id')
    .eq('id', user.id)
    .single()

  const isAdmin       = profile?.role === 'admin'
  const isChargeSite  = profile?.role === 'charge_site'

  // Seuls admin et référent handicap (charge_site) peuvent inviter
  if (!isAdmin && !isChargeSite) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { email, role, establishment_id } = await request.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'Email et rôle requis' }, { status: 400 })
  }

  // Règles d'invitation selon le rôle de l'invitant :
  // - admin         → peut inviter admin, charge_site, charge_mission, lecteur
  // - charge_site   → peut inviter charge_mission et lecteur uniquement (pas admin ni charge_site)
  const allowedRoles: Record<string, string[]> = {
    admin:       ['admin', 'charge_site', 'charge_mission', 'lecteur'],
    charge_site: ['charge_mission', 'lecteur'],
  }
  const inviterRole = profile?.role ?? 'lecteur'
  const permitted   = allowedRoles[inviterRole] ?? []

  if (!permitted.includes(role)) {
    return NextResponse.json(
      { error: `Vous n'êtes pas autorisé à inviter avec le rôle « ${role} »` },
      { status: 403 }
    )
  }

  // Un charge_site doit être rattaché à un site pour inviter
  if (isChargeSite && !profile?.establishment_id) {
    return NextResponse.json(
      { error: 'Vous devez être rattaché à un site pour inviter' },
      { status: 403 }
    )
  }

  // Le site de l'invité :
  // - charge_site : forcé sur son propre site
  // - admin       : utilise l'establishment_id envoyé (peut être null)
  const finalEstablishmentId = isChargeSite
    ? profile.establishment_id
    : (establishment_id ?? null)

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Redirection directe vers la page de complétion — le client Supabase
  // gère les tokens de l'invitation côté navigateur (pas de passage par /auth/callback)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/invite/complete`,
    data: {
      organization_id:  profile.organization_id,
      role,
      establishment_id: finalEstablishmentId,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
