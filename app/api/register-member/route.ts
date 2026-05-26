import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * POST /api/register-member
 *
 * Inscription d'un collaborateur pré-autorisé.
 * Flow :
 *   1. Vérification de l'email dans pending_members (whitelist)
 *   2. Création du compte Supabase Auth via la clé service (email confirmé d'emblée)
 *   3. Création du profil avec org / rôle / site
 *   4. Suppression de l'entrée pending_members
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
    }

    const { email, full_name, password } = body as {
      email?: string
      full_name?: string
      password?: string
    }

    if (!email || !full_name || !password) {
      return NextResponse.json({ error: 'Champs manquants (email, full_name, password)' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── 1. Vérification de la whitelist ────────────────────────────────────
    const { data: pending, error: pendingError } = await admin
      .from('pending_members')
      .select('id, organization_id, role, establishment_id')
      .eq('email', normalizedEmail)
      .single()

    if (pendingError || !pending) {
      return NextResponse.json(
        {
          error:
            "Cette adresse email n'est pas autorisée. Demandez à votre administrateur d'ajouter votre adresse dans l'espace Équipe.",
        },
        { status: 403 }
      )
    }

    // ── 2. Vérification : compte déjà existant ? ───────────────────────────
    // Tente de récupérer l'utilisateur par email avant de créer
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const alreadyExists = existingUsers?.users?.some(
      u => u.email?.toLowerCase() === normalizedEmail
    )
    if (alreadyExists) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà associée à un compte. Connectez-vous directement.' },
        { status: 409 }
      )
    }

    // ── 3. Création du compte Supabase Auth ───────────────────────────────
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    })

    if (createError || !authData?.user) {
      const msg = createError?.message ?? ''
      if (
        msg.includes('already been registered') ||
        msg.includes('already exists') ||
        msg.includes('already registered')
      ) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà associée à un compte. Connectez-vous directement.' },
          { status: 409 }
        )
      }
      console.error('[register-member] createUser error:', createError)
      return NextResponse.json(
        { error: `Erreur lors de la création du compte : ${msg || 'erreur inconnue'}` },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // ── 4. Création du profil ──────────────────────────────────────────────
    // Normalise le rôle pour respecter la contrainte check de la table profiles
    // (admin | charge_site | charge_mission | lecteur)
    const allowedRoles = ['admin', 'charge_site', 'charge_mission', 'lecteur']
    const safeRole = allowedRoles.includes(pending.role) ? pending.role : 'lecteur'

    const { error: profileError } = await admin.from('profiles').upsert({
      id:               userId,
      organization_id:  pending.organization_id,
      role:             safeRole,
      establishment_id: pending.establishment_id ?? null,
      full_name:        full_name.trim(),
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback : supprime l'utilisateur auth pour ne pas laisser de compte orphelin
      await admin.auth.admin.deleteUser(userId)
      console.error('[register-member] profile insert error:', profileError)
      return NextResponse.json(
        {
          error: `Erreur lors de la création du profil : ${profileError.message}`,
        },
        { status: 500 }
      )
    }

    // ── 5. Suppression de l'entrée whitelist ──────────────────────────────
    const { error: deleteError } = await admin
      .from('pending_members')
      .delete()
      .eq('id', pending.id)

    if (deleteError) {
      // Non bloquant — le compte est créé, on log juste l'erreur
      console.warn('[register-member] pending delete error:', deleteError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register-member] unexpected error:', err)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue. Réessayez dans quelques instants.' },
      { status: 500 }
    )
  }
}
