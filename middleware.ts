import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Pages publiques d'auth non-dashboard
  if (pathname.startsWith('/invite/') || pathname.startsWith('/join')) return supabaseResponse

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isDashboardPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/rqth') ||
    pathname.startsWith('/esat') ||
    pathname.startsWith('/calendrier') ||
    pathname.startsWith('/parametres') ||
    pathname.startsWith('/equipe') ||
    pathname.startsWith('/budget') ||
    pathname.startsWith('/etablissements') ||
    pathname.startsWith('/doeth') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/guide')

  const adminOnlyRoutes = ['/doeth', '/etablissements']
  const adminOrChargeRoutes = ['/budget', '/parametres']

  const normalizeRole = (role: string | null | undefined): 'admin' | 'charge_site' | 'lecteur' => {
    if (role === 'admin') return 'admin'
    if (role === 'charge_site' || role === 'charge_mission' || role === 'referent') return 'charge_site'
    return 'lecteur'
  }

  // Non authentifié → login
  if (!user && (isDashboardPage || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authentifié sur page auth → dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Authentifié sur page dashboard → vérifie si l'org existe
  if (user && isDashboardPage) {
    try {
      // Priorité : lire le rôle depuis app_metadata du JWT (injecté par custom_access_token_hook)
      // → élimine le round-trip DB sur chaque requête navigateur
      // Fallback sur DB si le hook JWT n'est pas encore configuré
      const jwtRole = (user.app_metadata as Record<string, string> | undefined)?.talenth_role

      let orgId: string | null = null
      let role: 'admin' | 'charge_site' | 'lecteur'

      if (jwtRole) {
        // Rôle disponible dans le JWT — on fait quand même un appel minimal pour org_id
        // (org_id n'est pas dans le JWT, mais ce SELECT est très léger)
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        orgId = profile?.organization_id ?? null
        role = normalizeRole(jwtRole)
      } else {
        // Fallback : lecture complète du profil (comportement avant migration JWT)
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, role')
          .eq('id', user.id)
          .single()
        orgId = profile?.organization_id ?? null
        role = normalizeRole(profile?.role)
      }

      if (!orgId) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Vérification abonnement : si expiré, seuls /settings/billing et /parametres sont accessibles
      const allowedWhenExpired = ['/settings/billing', '/parametres']
      const isAllowedWhenExpired = allowedWhenExpired.some(r => pathname.startsWith(r))

      if (!isAllowedWhenExpired) {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status, trial_ends_at')
          .eq('id', orgId)
          .single()

        if (org) {
          const now = new Date()
          const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null
          const isTrialing = org.subscription_status === 'trialing' && (trialEndsAt === null || trialEndsAt > now)
          const isActive = org.subscription_status === 'active' || isTrialing

          if (!isActive) {
            return NextResponse.redirect(new URL('/settings/billing', request.url))
          }
        }
      }

      // Routes admin uniquement
      if (adminOnlyRoutes.some(r => pathname.startsWith(r)) && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Routes admin + charge_site (sauf si accès autorisé même expiré)
      if (adminOrChargeRoutes.some(r => pathname.startsWith(r)) && role === 'lecteur' && !isAllowedWhenExpired) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      // En cas d'erreur DB (ex : table manquante), on laisse passer plutôt que de boucler
      return supabaseResponse
    }
  }

  return supabaseResponse
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
