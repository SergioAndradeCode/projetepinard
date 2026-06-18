'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ShieldCheck, ArrowRight, Building2, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ── Pricing (HT en euros) ─────────────────────────────────────────────────
const PLAN_PRICING: Record<string, Record<string, { ht: number; planName: string; cycleLabel: string }>> = {
  essentiel: {
    monthly:        { ht: 39,   planName: 'Essentiel', cycleLabel: 'Mensuel' },
    annual_monthly: { ht: 33,   planName: 'Essentiel', cycleLabel: 'Annuel mensuel' },
    annual_upfront: { ht: 396,  planName: 'Essentiel', cycleLabel: 'Annuel en 1 paiement' },
  },
  equipe: {
    monthly:        { ht: 89,   planName: 'Équipe', cycleLabel: 'Mensuel' },
    annual_monthly: { ht: 75,   planName: 'Équipe', cycleLabel: 'Annuel mensuel' },
    annual_upfront: { ht: 900,  planName: 'Équipe', cycleLabel: 'Annuel en 1 paiement' },
  },
  organisation: {
    monthly:        { ht: 179,  planName: 'Organisation', cycleLabel: 'Mensuel' },
    annual_monthly: { ht: 152,  planName: 'Organisation', cycleLabel: 'Annuel mensuel' },
    annual_upfront: { ht: 1824, planName: 'Organisation', cycleLabel: 'Annuel en 1 paiement' },
  },
}

const PLAN_IDS = Object.keys(PLAN_PRICING)
const CYCLE_IDS = ['monthly', 'annual_monthly', 'annual_upfront']

const CYCLE_LABELS: Record<string, string> = {
  monthly:        'Mensuel',
  annual_monthly: 'Annuel mensuel (−15%)',
  annual_upfront: 'Annuel en 1 paiement (−15%)',
}

const schema = z.object({
  companyName:         z.string().min(2, 'Raison sociale requise'),
  siret:               z.string()
    .transform(s => s.replace(/\s/g, ''))
    .refine(s => /^\d{14}$/.test(s), 'SIRET invalide (14 chiffres)'),
  billingAddress:      z.string().min(5, 'Adresse requise'),
  postalCode:          z.string().min(4, 'Code postal requis'),
  city:                z.string().min(2, 'Ville requise'),
  country:             z.string(),
  firstname:           z.string().min(2, 'Prénom requis'),
  lastname:            z.string().min(2, 'Nom requis'),
  contactFunction:     z.string().optional(),
  email:               z.string().email('Email invalide'),
  phone:               z.string().optional(),
  plan:                z.string().refine(p => PLAN_IDS.includes(p), 'Plan invalide'),
  billingCycle:        z.string().refine(c => CYCLE_IDS.includes(c), 'Cycle invalide'),
  purchaseOrderNumber: z.string().optional(),
  message:             z.string().max(1000).optional(),
  acceptCgv:           z.boolean().refine(v => v === true, 'Vous devez accepter les CGV'),
  confirmHabilite:     z.boolean().refine(v => v === true, 'Confirmation requise'),
})

type FormData = z.infer<typeof schema>

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export default function CommanderPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultPlan  = params.get('plan')  ?? 'essentiel'
  const defaultCycle = params.get('cycle') ?? 'annual_upfront'

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country:      'France',
      plan:         PLAN_IDS.includes(defaultPlan) ? defaultPlan : 'essentiel',
      billingCycle: CYCLE_IDS.includes(defaultCycle) ? defaultCycle : 'annual_upfront',
    },
  })

  const selectedPlan  = watch('plan')
  const selectedCycle = watch('billingCycle')

  const pricing = PLAN_PRICING[selectedPlan]?.[selectedCycle]
  const amountHt  = pricing?.ht ?? 0
  const amountTva = parseFloat((amountHt * 0.2).toFixed(2))
  const amountTtc = parseFloat((amountHt + amountTva).toFixed(2))

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/commandes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de la commande. Réessayez.')
        return
      }
      router.push(
        `/commander/confirmation?invoice=${encodeURIComponent(json.invoiceNumber)}&plan=${encodeURIComponent(json.planName)}&ttc=${json.amountTtc}&email=${encodeURIComponent(data.email)}`
      )
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-3">Commander</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-4">
            Commander Talenth
          </h1>
          <p className="text-[#6B7280] leading-relaxed max-w-xl mx-auto">
            Remplissez ce formulaire. Vous recevrez votre facture par email sous quelques minutes,
            avec toutes les informations pour effectuer votre virement.
          </p>
        </div>

        {/* Récapitulatif plan */}
        {pricing && (
          <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#1E4A8C] uppercase tracking-wider mb-1">Plan sélectionné</p>
              <p className="text-lg font-black text-[#1A1A2E]">{pricing.planName}</p>
              <p className="text-sm text-[#6B7280]">{pricing.cycleLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#1A1A2E]">{fmt(amountHt)}<span className="text-sm font-normal text-[#6B7280]"> HT</span></p>
              <p className="text-xs text-[#6B7280]">TVA 20 % : {fmt(amountTva)}</p>
              <p className="text-xs font-semibold text-[#1A1A2E] mt-0.5">Total TTC : {fmt(amountTtc)}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>

          {/* ── Entreprise ─────────────────────────────────────────────── */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#EBF2FA] rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#1E4A8C]" />
              </div>
              <h2 className="text-base font-bold text-[#1A1A2E]">Informations entreprise</h2>
            </div>

            <div className="space-y-4">
              <Field label="Raison sociale" required error={errors.companyName?.message}>
                <Input
                  id="companyName"
                  placeholder="Société Exemple SA"
                  autoComplete="organization"
                  aria-describedby={errors.companyName ? 'err-companyName' : undefined}
                  {...register('companyName')}
                />
              </Field>

              <Field label="N° SIRET" required error={errors.siret?.message}
                help="14 chiffres, sans espaces">
                <Input
                  id="siret"
                  placeholder="12345678901234"
                  inputMode="numeric"
                  maxLength={17}
                  aria-describedby={errors.siret ? 'err-siret' : undefined}
                  {...register('siret')}
                />
              </Field>

              <Field label="Adresse de facturation" required error={errors.billingAddress?.message}>
                <Input
                  id="billingAddress"
                  placeholder="12 rue de la Paix"
                  autoComplete="street-address"
                  aria-describedby={errors.billingAddress ? 'err-billingAddress' : undefined}
                  {...register('billingAddress')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Code postal" required error={errors.postalCode?.message}>
                  <Input
                    id="postalCode"
                    placeholder="75001"
                    autoComplete="postal-code"
                    maxLength={10}
                    aria-describedby={errors.postalCode ? 'err-postalCode' : undefined}
                    {...register('postalCode')}
                  />
                </Field>
                <Field label="Ville" required error={errors.city?.message}>
                  <Input
                    id="city"
                    placeholder="Paris"
                    autoComplete="address-level2"
                    aria-describedby={errors.city ? 'err-city' : undefined}
                    {...register('city')}
                  />
                </Field>
              </div>

              <Field label="Pays" error={errors.country?.message}>
                <Input
                  id="country"
                  placeholder="France"
                  autoComplete="country-name"
                  {...register('country')}
                />
              </Field>
            </div>
          </section>

          {/* ── Contact ────────────────────────────────────────────────── */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#EBF2FA] rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-[#1E4A8C]" />
              </div>
              <h2 className="text-base font-bold text-[#1A1A2E]">Contact administrateur</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom" required error={errors.firstname?.message}>
                  <Input
                    id="firstname"
                    placeholder="Marie"
                    autoComplete="given-name"
                    aria-describedby={errors.firstname ? 'err-firstname' : undefined}
                    {...register('firstname')}
                  />
                </Field>
                <Field label="Nom" required error={errors.lastname?.message}>
                  <Input
                    id="lastname"
                    placeholder="Dupont"
                    autoComplete="family-name"
                    aria-describedby={errors.lastname ? 'err-lastname' : undefined}
                    {...register('lastname')}
                  />
                </Field>
              </div>

              <Field label="Fonction" error={errors.contactFunction?.message}>
                <Input
                  id="contactFunction"
                  placeholder="DRH, Référent Handicap..."
                  autoComplete="organization-title"
                  {...register('contactFunction')}
                />
              </Field>

              <Field label="Email professionnel" required error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="marie.dupont@entreprise.fr"
                  autoComplete="email"
                  aria-describedby={errors.email ? 'err-email' : undefined}
                  {...register('email')}
                />
              </Field>

              <Field label="Téléphone" error={errors.phone?.message}>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  autoComplete="tel"
                  {...register('phone')}
                />
              </Field>
            </div>
          </section>

          {/* ── Commande ───────────────────────────────────────────────── */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#EBF2FA] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#1E4A8C]" />
              </div>
              <h2 className="text-base font-bold text-[#1A1A2E]">Votre commande</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Plan" required error={errors.plan?.message}>
                  <select
                    id="plan"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('plan')}
                  >
                    <option value="essentiel">Essentiel (1 utilisateur)</option>
                    <option value="equipe">Equipe (5 utilisateurs)</option>
                    <option value="organisation">Organisation (15 utilisateurs)</option>
                  </select>
                </Field>

                <Field label="Facturation" required error={errors.billingCycle?.message}>
                  <select
                    id="billingCycle"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('billingCycle')}
                  >
                    {Object.entries(CYCLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="N° bon de commande interne" error={undefined}
                help="Optionnel, mentionnez-le dans votre virement">
                <Input
                  id="purchaseOrderNumber"
                  placeholder="BDC-2026-XXXX"
                  {...register('purchaseOrderNumber')}
                />
              </Field>

              <Field label="Message / demande particulière" error={undefined}>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Toute information utile pour votre commande..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  {...register('message')}
                />
              </Field>
            </div>
          </section>

          {/* ── Consentement ───────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acceptCgv"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E4A8C] focus:ring-[#1E4A8C] cursor-pointer"
                aria-describedby={errors.acceptCgv ? 'err-acceptCgv' : undefined}
                {...register('acceptCgv')}
              />
              <label htmlFor="acceptCgv" className="text-sm text-[#1A1A2E] cursor-pointer leading-relaxed">
                J&apos;accepte les{' '}
                <a href="/cgv" target="_blank" className="text-[#1E4A8C] underline">conditions générales de vente</a>{' '}
                et la{' '}
                <a href="/confidentialite" target="_blank" className="text-[#1E4A8C] underline">politique de confidentialité</a>
                {' '}de Talenth.{' '}
                <span className="text-[#B71C1C]">*</span>
              </label>
            </div>
            {errors.acceptCgv && (
              <p id="err-acceptCgv" role="alert" className="text-xs text-[#B71C1C] ml-7">
                {errors.acceptCgv.message}
              </p>
            )}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirmHabilite"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E4A8C] focus:ring-[#1E4A8C] cursor-pointer"
                aria-describedby={errors.confirmHabilite ? 'err-confirmHabilite' : undefined}
                {...register('confirmHabilite')}
              />
              <label htmlFor="confirmHabilite" className="text-sm text-[#1A1A2E] cursor-pointer leading-relaxed">
                Je confirme être habilité(e) à passer cette commande au nom de mon entreprise.{' '}
                <span className="text-[#B71C1C]">*</span>
              </label>
            </div>
            {errors.confirmHabilite && (
              <p id="err-confirmHabilite" role="alert" className="text-xs text-[#B71C1C] ml-7">
                {errors.confirmHabilite.message}
              </p>
            )}
          </section>

          {/* ── Récap montant + bouton ──────────────────────────────────── */}
          {pricing && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#1A1A2E] text-base">{fmt(amountHt)} HT</span>
                {' '}· TVA 20 % ({fmt(amountTva)}) · Total TTC : <span className="font-semibold text-[#1A1A2E]">{fmt(amountTtc)}</span>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#1E4A8C] hover:bg-[#163870] text-white font-bold px-6 py-3 rounded-xl text-sm w-full sm:w-auto"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                  : <>Envoyer ma commande <ArrowRight className="w-4 h-4" /></>
                }
              </Button>
            </div>
          )}

          {/* Réassurance */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
            <ShieldCheck className="w-4 h-4" />
            Données sécurisées · Aucun prélèvement automatique · Facture envoyée par email
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Composant Field réutilisable ──────────────────────────────────────────
function Field({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={undefined} className="text-sm font-medium text-[#1A1A2E]">
        {label}{required && <span className="text-[#B71C1C] ml-0.5"> *</span>}
      </Label>
      {children}
      {help && !error && <p className="text-xs text-[#9CA3AF]">{help}</p>}
      {error && (
        <p role="alert" className="text-xs text-[#B71C1C]">{error}</p>
      )}
    </div>
  )
}
