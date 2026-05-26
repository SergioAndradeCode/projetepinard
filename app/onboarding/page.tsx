'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, Calculator, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCoefficientContribution, getSmicRef } from '@/lib/oeth/calculs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

const step1Schema = z.object({
  orgName: z.string().min(2, "Nom de l'organisation requis"),
  orgType: z.enum(['entreprise', 'cabinet']),
  siret: z.string().optional(),
})

const step2Schema = z.object({
  effectif_assujettissement: z.number({ message: 'Effectif requis' }).int().positive({ message: 'Doit être > 0' }),
  effectif_brut: z.number({ message: 'Effectif brut requis' }).int().positive({ message: 'Doit être > 0' }),
  effectif_ecap: z.number().int().min(0).optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const ETAPES = [
  { num: 1, label: 'Votre organisation', icon: Building2 },
  { num: 2, label: 'Paramètres OETH', icon: Calculator },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'utilisateur'
      setUserName(name)
    })
  }, [supabase, router])

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { orgType: 'entreprise' },
  })

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { effectif_ecap: 0 },
  })

  const orgType = form1.watch('orgType')

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data)
    setStep(2)
    window.scrollTo(0, 0)
  }

  const handleStep2 = async (data: Step2Data) => {
    if (!step1Data) return
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      const annee = new Date().getFullYear()
      const smicRef = getSmicRef(annee)
      const coeffContrib = getCoefficientContribution(data.effectif_assujettissement)

      // 1. Créer l'organisation
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: step1Data.orgName,
          type: step1Data.orgType,
          siret: step1Data.siret || null,
        })
        .select()
        .single()

      if (orgError) throw orgError

      // 2. Upsert profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          organization_id: org.id,
          role: 'admin',
          full_name: userName || user.email?.split('@')[0] || 'Utilisateur',
        })
      if (profileError) throw profileError

      // 3. Créer les paramètres OETH — coefficient calculé automatiquement
      const { error: settingsError } = await supabase
        .from('oeth_settings')
        .insert({
          organization_id: org.id,
          annee,
          effectif_assujettissement: data.effectif_assujettissement,
          effectif_brut: data.effectif_brut,
          effectif_ecap: data.effectif_ecap ?? 0,
          smic_horaire_ref: smicRef,
          coefficient_contribution: coeffContrib,
        })

      if (settingsError) throw settingsError

      toast.success('Organisation configurée avec succès !')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Erreur lors de la configuration'
      toast.error(msg)
      setErrorMsg(msg)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[520px]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-[#1E4A8C] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-[22px] font-bold text-[#1E4A8C]">Talenth</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#1A1A2E]">
          Bienvenue{userName ? `, ${userName.split(' ')[0]}` : ''} !
        </h1>
        <p className="text-[#6B7280] mt-1 text-sm">
          Configurons votre espace en 2 minutes
        </p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-8">
        {ETAPES.map((etape, i) => {
          const isActive = step === etape.num
          const isDone = step > etape.num
          return (
            <div key={etape.num} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#EBF2FA] border border-[#1E4A8C]/30'
                  : isDone
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-white border border-[#E2E8F0]'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive ? 'bg-[#1E4A8C] text-white'
                  : isDone ? 'bg-green-500 text-white'
                  : 'bg-[#E2E8F0] text-[#6B7280]'
                }`}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : etape.num}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-[#1E4A8C]' : isDone ? 'text-green-700' : 'text-[#6B7280]'}`}>
                  {etape.label}
                </span>
              </div>
              {i < ETAPES.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[#E2E8F0] shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">

        {/* ─── ÉTAPE 1 ─── */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1A1A2E]">Votre organisation</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">Ces informations apparaîtront dans vos rapports OETH</p>
            </div>

            <div className="space-y-1.5">
              <Label>Type de compte</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['entreprise', 'cabinet'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => form1.setValue('orgType', type)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors text-left ${
                      orgType === type
                        ? 'border-[#1E4A8C] bg-[#EBF2FA] text-[#1E4A8C]'
                        : 'border-[#E2E8F0] text-[#6B7280] hover:border-[#2E75B6]'
                    }`}
                  >
                    <p className="font-semibold">{type === 'entreprise' ? 'Entreprise' : 'Cabinet RH'}</p>
                    <p className="text-xs mt-0.5 opacity-70">
                      {type === 'entreprise' ? 'Je gère ma propre OETH' : "Je pilote l'OETH de mes clients"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                {orgType === 'cabinet' ? 'Nom du cabinet' : "Nom de l'entreprise"}
              </Label>
              <Input
                placeholder={orgType === 'cabinet' ? 'Cabinet RH Exemple' : 'Mon Entreprise SAS'}
                {...form1.register('orgName')}
              />
              {form1.formState.errors.orgName && (
                <p className="text-xs text-[#B71C1C]">{form1.formState.errors.orgName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>SIRET <span className="text-[#6B7280] font-normal">(optionnel)</span></Label>
              <Input placeholder="12345678901234" {...form1.register('siret')} />
            </div>

            <Button type="submit" className="w-full gap-2 mt-2">
              Continuer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* ─── ÉTAPE 2 ─── */}
        {step === 2 && (
          <form className="space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1A1A2E]">Paramètres OETH</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Ces données servent à calculer votre taux et votre contribution AGEFIPH
              </p>
            </div>

            {/* Effectif d'assujettissement */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Effectif d&apos;assujettissement <span className="text-[#B71C1C]">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <Info className="w-4 h-4 text-[#6B7280]" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Effectif annuel moyen pris en compte pour le quota légal de 6%. Pour les entreprises de 20 salariés et plus.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                placeholder="ex : 150"
                {...form2.register('effectif_assujettissement', { valueAsNumber: true })}
              />
              {form2.formState.errors.effectif_assujettissement && (
                <p className="text-xs text-[#B71C1C]">{form2.formState.errors.effectif_assujettissement.message}</p>
              )}
            </div>

            {/* Effectif brut + ECAP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>Effectif brut <span className="text-[#B71C1C]">*</span></Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <Info className="w-4 h-4 text-[#6B7280]" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Nombre total de salariés (CDI, CDD, temps partiel…) avant toute déduction. Sert de base au calcul des UB requises.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  placeholder="ex : 160"
                  {...form2.register('effectif_brut', { valueAsNumber: true })}
                />
                {form2.formState.errors.effectif_brut && (
                  <p className="text-xs text-[#B71C1C]">{form2.formState.errors.effectif_brut.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>Effectif ECAP</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <Info className="w-4 h-4 text-[#6B7280]" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Salariés en Emploi Ciblé d&apos;Accès Prioritaire. Laissez 0 si vous n&apos;avez pas ce dispositif.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  {...form2.register('effectif_ecap', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Info coefficient auto-calculé */}
            <div className="bg-[#EBF2FA] rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#1E4A8C] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1E4A8C]">
                Le SMIC de référence et le coefficient de contribution sont calculés automatiquement selon votre effectif et l&apos;année en cours. Vous pourrez les ajuster dans les Paramètres.
              </p>
            </div>

            {/* Résumé */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Récapitulatif</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Organisation</span>
                <span className="font-medium text-[#1A1A2E]">{step1Data?.orgName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Type</span>
                <span className="font-medium text-[#1A1A2E] capitalize">{step1Data?.orgType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Année de référence</span>
                <span className="font-medium text-[#1A1A2E]">{new Date().getFullYear()}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Retour
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2"
                disabled={loading}
                onClick={() => form2.handleSubmit(handleStep2)()}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Configuration en cours…</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />Créer mon espace Talenth</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
