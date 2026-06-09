'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const schema = z.object({
  fullName:  z.string().min(2, 'Nom requis'),
  orgName:   z.string().min(2, "Nom de l'organisation requis"),
  orgType:   z.enum(['entreprise', 'cabinet']),
  email:     z.string().email('Email invalide'),
  password:  z.string().min(8, '8 caractères minimum'),
  cgu:       z.literal(true, { message: 'Vous devez accepter les CGU et la politique de confidentialité' }),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { orgType: 'entreprise', cgu: undefined },
  })

  const orgType = watch('orgType')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          org_name: data.orgName,
          org_type: data.orgType,
        },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="w-full max-w-[480px]">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#1E4A8C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-[22px] font-bold text-[#1E4A8C]">Talenth</span>
          </div>
          <p className="text-[#6B7280] text-sm mt-1">Pilotage OETH simplifié</p>
        </div>

        <h1 className="text-[22px] font-semibold text-[#1A1A2E] mb-6 text-center">
          Créer un compte
        </h1>

        {/* OAuth */}
        <div className="space-y-3 mb-4">
          <Button type="button" variant="secondary" className="w-full" onClick={() => handleOAuth('google')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => handleOAuth('azure')}>
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Continuer avec Microsoft
          </Button>
          {/* Transparence OAuth, RGPD art. 13 */}
          <p className="text-[10px] text-[#9CA3AF] text-center leading-relaxed px-2">
            En utilisant Google ou Microsoft, votre adresse email et votre profil de base seront partagés
            avec ces fournisseurs conformément à leurs propres politiques de confidentialité.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Separator className="flex-1" />
          <span className="text-xs text-[#6B7280]">ou</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type de compte */}
          <div className="space-y-1.5">
            <Label>Type de compte</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['entreprise', 'cabinet'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('orgType', type)}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    orgType === type
                      ? 'border-[#1E4A8C] bg-[#EBF2FA] text-[#1E4A8C]'
                      : 'border-[#E2E8F0] text-[#6B7280] hover:border-[#2E75B6]'
                  }`}
                >
                  {type === 'entreprise' ? 'Entreprise' : 'Cabinet RH'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Votre nom complet</Label>
            <Input id="fullName" placeholder="Marie Dupont" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-[#B71C1C]">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgName">
              {orgType === 'cabinet' ? 'Nom du cabinet' : "Nom de l'entreprise"}
            </Label>
            <Input
              id="orgName"
              placeholder={orgType === 'cabinet' ? 'Cabinet RH Example' : 'Mon Entreprise SAS'}
              {...register('orgName')}
            />
            {errors.orgName && <p className="text-xs text-[#B71C1C]">{errors.orgName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email professionnel</Label>
            <Input id="email" type="email" placeholder="vous@entreprise.fr" {...register('email')} />
            {errors.email && <p className="text-xs text-[#B71C1C]">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="8 caractères minimum" {...register('password')} />
            {errors.password && <p className="text-xs text-[#B71C1C]">{errors.password.message}</p>}
          </div>

          {/* Consentement CGU / Politique de confidentialité */}
          <Controller
            name="cgu"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={field.value === true}
                      onChange={e => field.onChange(e.target.checked ? true : undefined)}
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      field.value === true
                        ? 'bg-[#1E4A8C] border-[#1E4A8C]'
                        : 'border-[#D1D5DB] group-hover:border-[#1E4A8C]'
                    }`}>
                      {field.value === true && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#6B7280] leading-relaxed">
                    J&apos;ai lu et j&apos;accepte les{' '}
                    <Link href="/cgv" target="_blank" className="text-[#1E4A8C] font-medium hover:underline">
                      Conditions Générales d&apos;Utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/confidentialite" target="_blank" className="text-[#1E4A8C] font-medium hover:underline">
                      Politique de confidentialité
                    </Link>{' '}
                    de Talenth, y compris le traitement de données à caractère personnel dans le cadre de la gestion OETH.
                  </span>
                </label>
                {errors.cgu && (
                  <p className="text-xs text-[#B71C1C] pl-7">{errors.cgu.message}</p>
                )}
              </div>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer mon compte
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
