import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculerStats } from '@/lib/oeth/calculs'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 })
  }

  const orgId = profile.organization_id
  const annee = new Date().getFullYear()

  const [{ data: settings }, { data: salaries }, { data: achats }] = await Promise.all([
    supabase.from('oeth_settings').select('*').eq('organization_id', orgId).eq('annee', annee).single(),
    supabase.from('rqth_employees').select('*').eq('organization_id', orgId),
    supabase.from('esat_purchases').select('*').eq('organization_id', orgId),
  ])

  if (!settings) return NextResponse.json({ error: 'Paramètres OETH manquants' }, { status: 404 })

  // Si effectif_brut est 0 (migration pas encore faite), fallback sur effectif_assujettissement
  const effectifBrut = settings.effectif_brut || settings.effectif_assujettissement
  const effectifEcap = settings.effectif_ecap || 0

  const stats = calculerStats(
    salaries ?? [],
    achats ?? [],
    effectifBrut,
    effectifEcap,
    settings.smic_horaire_ref,
  )

  return NextResponse.json(stats)
}
