'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@supabase/supabase-js'

const schema = z.object({
  full_name: z.string().min(2, 'Minimum 2 caractères'),
  password:  z.string().min(8, 'Minimum 8 caractères'),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function InviteCompletePage() {
  const router = useRouter()

  // ⚠️ Client créé avec detectSessionInUrl: false pour garder le contrôle
  // total sur la séquence de traitement des tokens d'invitation.
  // Sans ça, le client auto-échange le ?code= PKCE avant notre useEffect,
  // puis notre signOut + exchange manuel échouent → "lien invalide".
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { detectSessionInUrl: false } }
  ), [])

  const [email, setEmail]         = useState('')
  const [orgName, setOrgName]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [submitting, setSubmitting]     = useState(false)

  const initialized = useRef(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // ── Initialise le profil pour l'utilisateur invité ────────────────────────
  const initProfile = async (user: User) => {
    if (initialized.current) return
    initialized.current = true

    // Garde-fou : si le compte a déjà un nom, c'est un compte existant
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (existingProfile?.full_name) {
      router.replace('/dashboard')
      return
    }

    setEmail(user.email ?? '')

    let orgId = existingProfile?.organization_id

    if (!orgId) {
      const meta            = user.user_metadata ?? {}
      orgId                 = meta.organization_id ?? null
      const role            = meta.role ?? 'lecteur'
      const establishmentId = meta.establishment_id ?? null

      if (orgId) {
        await supabase.from('profiles').upsert(
          { id: user.id, organization_id: orgId, role, establishment_id: establishmentId, full_name: null },
          { onConflict: 'id', ignoreDuplicates: false }
        )
      }
    }

    if (orgId) {
      const { data: org } = await supabase
        .from('organizations').select('name').eq('id', orgId).single()
      setOrgName(org?.name ?? '')
    }

    setLoading(false)
  }

  // ── Traitement des tokens d'invitation ────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // ── Cas 1 : tokens dans le hash (flow implicite) ──────────────────────
      const hash        = window.location.hash.slice(1)
      const hashParams  = new URLSearchParams(hash)
      const accessToken  = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Déconnecte l'éventuelle session de l'invitant
        await supabase.auth.signOut({ scope: 'local' })
        if (!mounted) return

        const { data, error } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        })
        if (!mounted) return

        if (data?.user && !error) {
          window.history.replaceState({}, '', window.location.pathname)
          await initProfile(data.user)
        } else {
          setAuthError(true)
          setLoading(false)
        }
        return
      }

      // ── Cas 2 : code PKCE dans les query params ───────────────────────────
      const urlParams = new URLSearchParams(window.location.search)
      const code      = urlParams.get('code')

      if (code) {
        // Nettoie l'URL immédiatement avant tout traitement
        window.history.replaceState({}, '', window.location.pathname)

        // Déconnecte l'éventuelle session de l'invitant
        await supabase.auth.signOut({ scope: 'local' })
        if (!mounted) return

        // Échange le code PKCE — pour les invitations Supabase,
        // aucun code_verifier client n'est requis
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!mounted) return

        if (data?.user && !error) {
          await initProfile(data.user)
        } else {
          console.error('exchangeCodeForSession error:', error)
          setAuthError(true)
          setLoading(false)
        }
        return
      }

      // ── Cas 3 : invité qui revient sur la page (pas de tokens dans l'URL) ─
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('full_name').eq('id', session.user.id).single()

        if (profile?.full_name) {
          // Compte déjà configuré → redirection
          router.replace('/dashboard')
          return
        }

        // Profil sans nom → invité qui revient finaliser son compte
        await initProfile(session.user)
        return
      }

      // Aucun token, aucune session → lien invalide ou expiré
      if (mounted) {
        setAuthError(true)
        setLoading(false)
      }
    }

    init().catch((err) => {
      console.error('invite init error:', err)
      if (mounted) { setAuthError(true); setLoading(false) }
    })

    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Soumission du formulaire ───────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Vérification finale : l'utilisateur ne doit pas déjà avoir un full_name
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) {
        toast.error('Ce compte est déjà configuré.')
        router.replace('/dashboard')
        return
      }

      const { error: pwError } = await supabase.auth.updateUser({
        password: data.password,
        data: { full_name: data.full_name },
      })
      if (pwError) throw pwError

      const { error: profileError } = await supabase
        .from('profiles').update({ full_name: data.full_name }).eq('id', user.id)
      if (profileError) throw profileError

      toast.success('Compte créé, bienvenue !')
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E4A8C]" />
        <p className="text-sm text-[#6B7280]">Vérification de votre invitation…</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-[#6B7280] mb-6">
            Ce lien d&apos;invitation n&apos;est plus valide. Demandez à votre administrateur de vous envoyer une nouvelle invitation.
          </p>
          <Button variant="secondary" onClick={() => router.replace('/login')}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Talenth" width={44} height={44} />
            <span className="text-2xl font-bold text-[#1E4A8C]">Talenth</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          <div className="mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Finalisez votre compte</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Vous avez été invité à rejoindre
              {orgName ? <> <span className="font-medium text-[#1A1A2E]">{orgName}</span></> : ''} sur Talenth.
            </p>
          </div>

          {/* Email (lecture seule) */}
          <div className="mb-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <p className="text-xs text-[#6B7280]">Adresse email</p>
            <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{email}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Votre nom complet <span className="text-[#B71C1C]">*</span></Label>
              <Input placeholder="Prénom Nom" autoComplete="name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-xs text-[#B71C1C]">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Choisissez un mot de passe <span className="text-[#B71C1C]">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#B71C1C]">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Confirmez le mot de passe <span className="text-[#B71C1C]">*</span></Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('confirm')}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-xs text-[#B71C1C]">{errors.confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Création en cours…</>
                : 'Accéder à Talenth'
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B7280] mt-4">
          En accédant à Talenth, vous acceptez les conditions d&apos;utilisation.
        </p>
      </div>
    </div>
  )
}
