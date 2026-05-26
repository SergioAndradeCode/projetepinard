'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  full_name: z.string().min(2, 'Minimum 2 caractères'),
  email:     z.string().email('Email invalide'),
  password:  z.string().min(8, '8 caractères minimum'),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function JoinPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // ── 1. Création du compte via l'API (vérifie la whitelist) ─────────────
      const res = await fetch('/api/register-member', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:     data.email.toLowerCase().trim(),
          full_name: data.full_name.trim(),
          password:  data.password,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de la création du compte')
        setLoading(false)
        return
      }

      // ── 2. Connexion automatique ───────────────────────────────────────────
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    data.email.toLowerCase().trim(),
        password: data.password,
      })

      if (signInError) {
        // Compte créé mais connexion échouée → renvoyer vers login
        toast.success('Compte créé ! Connectez-vous maintenant.')
        router.push('/login')
        return
      }

      toast.success('Bienvenue sur Talenth !')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[480px]">
      <div className="bg-white rounded-2xl shadow-lg p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#1E4A8C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-[22px] font-bold text-[#1E4A8C]">Talenth</span>
          </div>
          <p className="text-[#6B7280] text-sm mt-1">Pilotage OETH simplifié</p>
        </div>

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#EBF2FA] rounded-xl flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[#1A1A2E]">Rejoindre votre équipe</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Votre administrateur a déjà configuré votre accès
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6 p-3 bg-[#EBF2FA] rounded-xl border border-[#1E4A8C]/15 text-xs text-[#1E4A8C]">
          Utilisez l&apos;adresse email que votre administrateur a enregistrée pour vous.
          Si vous ne connaissez pas votre adresse autorisée, contactez-le directement.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Votre nom complet <span className="text-[#B71C1C]">*</span></Label>
            <Input
              id="full_name"
              placeholder="Prénom Nom"
              autoComplete="name"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-[#B71C1C]">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email autorisée <span className="text-[#B71C1C]">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@entreprise.fr"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-[#B71C1C]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Choisissez un mot de passe <span className="text-[#B71C1C]">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#B71C1C]">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmer le mot de passe <span className="text-[#B71C1C]">*</span></Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Répétez le mot de passe"
                autoComplete="new-password"
                className="pr-10"
                {...register('confirm')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-xs text-[#B71C1C]">{errors.confirm.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Création du compte…</>
              : 'Accéder à Talenth'
            }
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#1E4A8C] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
