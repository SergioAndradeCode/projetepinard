import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages publiques — laisser passer sans vérification
  if (
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/tarifs') ||
    pathname.startsWith('/commander') ||
    pathname.startsWith('/mentions') ||
    pathname.startsWith('/auth/') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

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
    pathname.startsWith('/guide') ||
    pathname.startsWith('/maintien') ||
    pathname.startsWith('/onboarding')

  if (!isDashboardPage) return NextResponse.next()

  // Vérification légère : présence du cookie de session Supabase
  // La vérification réelle (JWT + rôle) est faite dans chaque server component
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)\./)?.[1] ?? ''
  const sessionCookie =
    request.cookies.get(`sb-${projectRef}-auth-token`) ??
    request.cookies.get(`sb-${projectRef}-auth-token.0`)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
