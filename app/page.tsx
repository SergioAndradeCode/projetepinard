import Link from 'next/link'
import {
  ArrowRight, CheckCircle, BarChart3, Users, FileText,
  ShieldCheck, TrendingUp, Building2,
  Heart, Wallet, UserCog, PlayCircle, CalendarDays,
} from 'lucide-react'
import { NavMarketing } from '@/components/marketing/NavMarketing'
import { FooterMarketing } from '@/components/marketing/FooterMarketing'
import { MockupDashboard, MockupRQTH, MockupDOETH } from '@/components/marketing/MockupDashboard'
import { FormDemo } from '@/components/marketing/FormDemo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavMarketing />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0F1F3A] min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0f00]/25 via-transparent to-[#0a1a30]/60 pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-10 w-full py-16 xl:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[54%_46%] gap-12 xl:gap-20 items-center">

            <div>
              <div className="inline-flex items-center gap-2 mb-8">
                <Heart className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[#F59E0B] text-xs font-semibold tracking-widest uppercase">Mission Handicap</span>
              </div>

              <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-black text-white leading-[1.06] tracking-tight mb-7">
                L&apos;inclusion professionnelle{' '}
                <span className="text-[#F59E0B]">mérite mieux</span>{' '}
                qu&apos;un tableur.
              </h1>

              <p className="text-lg xl:text-xl text-white/60 leading-relaxed max-w-xl mb-10">
                Talenth accompagne les équipes mission handicap dans leur quotidien,
                suivi des collaborateurs BOETH, maintien dans l&apos;emploi, conformité OETH
                et pilotage budgétaire, dans un seul outil, conçu pour des personnes qui s&apos;engagent.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#D97706] transition-colors text-sm shadow-lg"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/75 font-medium px-8 py-4 rounded-xl hover:bg-white/5 transition-colors text-sm"
                >
                  Demander une démonstration
                </a>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-8 border-t border-white/10">
                {[
                  { icon: ShieldCheck, label: 'Conformité OETH garantie' },
                  { icon: Building2,   label: 'Multi-établissements' },
                  { icon: Heart,       label: 'Centré sur l\'humain' },
                  { icon: TrendingUp,  label: 'Mis à jour chaque année' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-white/45 text-xs">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-white/35" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side : citation + chiffres clés */}
            <div className="hidden lg:flex flex-col gap-5">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
                <p className="text-white/75 text-lg leading-relaxed italic mb-5">
                  &ldquo;La mission handicap n&apos;est pas qu&apos;une obligation légale.
                  C&apos;est la promesse faite à chaque collaborateur concerné
                  qu&apos;il sera accompagné.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-semibold">Talenth</p>
                    <p className="text-white/35 text-xs">Notre conviction</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '560 000', label: 'Salariés BOETH en entreprise en France' },
                  { value: '6 %',     label: 'Quota légal d\'emploi à atteindre' },
                  { value: '< 50 %',  label: 'Des entreprises atteignent le quota' },
                  { value: '0 €',     label: 'De contribution si le quota est atteint' },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                    <p className="text-2xl font-black text-[#F59E0B] mb-1">{value}</p>
                    <p className="text-[11px] text-white/40 leading-snug">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MANIFESTE ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#FEFCF8]">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">Notre conviction</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-6 leading-tight">
              Derrière chaque chiffre OETH,<br />il y a une personne.
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed">
              Les équipes mission handicap jonglent entre des contraintes légales complexes et un engagement humain profond
              envers leurs collaborateurs. Talenth est construit pour honorer ces deux dimensions, sans les opposer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                color: 'bg-amber-50 text-[#D97706] border-amber-100',
                title: 'Centré sur les personnes',
                desc: 'Chaque fiche salarié, chaque situation de maintien dans l\'emploi, chaque reconnaissance, tous les outils sont conçus pour un suivi individualisé et humain.',
              },
              {
                icon: ShieldCheck,
                color: 'bg-blue-50 text-[#1E4A8C] border-blue-100',
                title: 'Sérieux sur la conformité',
                desc: 'Les calculs d\'unités bénéficiaires, les coefficients seniors, les déductions ESAT/EA, tout est conforme aux règles AGEFIPH en vigueur, mis à jour chaque année.',
              },
              {
                icon: Users,
                color: 'bg-green-50 text-green-700 border-green-100',
                title: 'Fait pour les équipes',
                desc: 'Du référent national au chargé de mission local, chaque membre de l\'équipe dispose d\'un accès adapté à son rôle et à son périmètre géographique.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="p-8 bg-white rounded-2xl border border-[#F0EBE3] shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1A1A2E] mb-3 text-lg">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LES DÉFIS ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">Le constat</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
              Les défis des équipes mission handicap
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">
              Nous avons travaillé avec des référents handicap pour comprendre leur réalité quotidienne.
              Voici ce qui revient le plus souvent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                bg: 'bg-red-50 border-red-100',
                iconColor: 'text-red-500',
                title: 'Des calculs qui prennent trop de place',
                desc: 'UB proratisées, coefficient senior ×1,5, déductions ESAT/EA… La formule légale évolue chaque année et une erreur sur la DOETH peut générer une majoration de contribution.',
              },
              {
                icon: Heart,
                bg: 'bg-orange-50 border-orange-100',
                iconColor: 'text-orange-500',
                title: 'Des situations individuelles perdues de vue',
                desc: 'AT/MP, inaptitude, aménagement de poste… Ces accompagnements essentiels finissent dans des emails et des tableurs épars, au détriment du salarié et de la traçabilité.',
              },
              {
                icon: Building2,
                bg: 'bg-blue-50 border-blue-100',
                iconColor: 'text-blue-500',
                title: 'Une coordination difficile sur plusieurs sites',
                desc: 'Quand la politique handicap couvre plusieurs établissements, consolider les données devient un exercice manuel et chaque chargé de mission travaille en silo.',
              },
            ].map(({ icon: Icon, bg, iconColor, title, desc }) => (
              <div key={title} className="p-7 bg-white rounded-2xl border border-[#E2E8F0] hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${bg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-[#1A1A2E] mb-2.5 text-base">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ──────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 bg-[#FEFCF8] border-y border-[#F0EBE3]">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">La solution</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
              Un outil complet pour toute<br />l&apos;équipe mission handicap.
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto text-lg">
              Du référent national au chargé de mission local, chacun dispose de son périmètre,
              avec les données dont il a besoin, sans complexité.
            </p>
          </div>

          <div className="space-y-24">

            {/* 1, Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
              <div>
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-6 shadow-sm">
                  <BarChart3 className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <h3 className="text-2xl xl:text-3xl font-black text-[#1A1A2E] mb-4">Tableau de bord OETH en temps réel</h3>
                <p className="text-[#6B7280] leading-relaxed mb-7 text-lg">
                  Visualisez instantanément votre taux d&apos;emploi, vos unités bénéficiaires, votre contribution AGEFIPH estimée
                  et votre projection de fin d&apos;année, consolidés sur l&apos;ensemble de vos établissements.
                </p>
                <ul className="space-y-3">
                  {[
                    'Statut conforme / non conforme en un coup d\'œil',
                    'Projection mensuelle basée sur les reconnaissances actives',
                    'Coefficient senior BOETH 50 ans et plus automatique (×1,5 UB)',
                    'Répartition par établissement pour les organisations multi-sites',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-[#1A1A2E]">
                      <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div><MockupDashboard /></div>
            </div>

            {/* 2, BOETH */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
              <div className="lg:order-2">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-6 shadow-sm">
                  <Users className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <h3 className="text-2xl xl:text-3xl font-black text-[#1A1A2E] mb-4">Suivi des collaborateurs BOETH</h3>
                <p className="text-[#6B7280] leading-relaxed mb-7 text-lg">
                  Chaque bénéficiaire de l&apos;obligation d&apos;emploi mérite un suivi rigoureux. Talenth calcule les unités
                  bénéficiaires en tenant compte du temps de travail, des dates de reconnaissance et de l&apos;âge.
                </p>
                <ul className="space-y-3">
                  {[
                    'Tous types : RQTH, AAH, pension d\'invalidité, rente AT/MP, carte invalidité…',
                    'Alertes automatiques 90 jours avant chaque expiration de reconnaissance',
                    'Calcul UB proratisé au mois de présence effectif',
                    'Import CSV pour intégrer votre fichier RH existant',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-[#1A1A2E]">
                      <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:order-1"><MockupRQTH /></div>
            </div>

            {/* 3, Maintien dans l'emploi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6 shadow-sm">
                  <Heart className="w-5 h-5 text-[#D97706]" />
                </div>
                <h3 className="text-2xl xl:text-3xl font-black text-[#1A1A2E] mb-4">Maintien dans l&apos;emploi</h3>
                <p className="text-[#6B7280] leading-relaxed mb-7 text-lg">
                  C&apos;est souvent la partie la plus humaine et la plus délicate de la mission. Talenth vous aide
                  à documenter et piloter chaque situation individuelle, AT/MP, inaptitude, aménagement de poste.
                </p>
                <ul className="space-y-3">
                  {[
                    'Suivi par type : AT/MP, maladie longue durée, inaptitude partielle ou totale',
                    'Statuts de situation : en cours, aménagé, reclassé, résolu, rupture',
                    'Traçabilité des acteurs (médecin du travail, SAMETH, Cap Emploi)',
                    'Historique complet rattaché au profil du salarié',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-[#1A1A2E]">
                      <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Mockup maintien */}
              <div className="bg-white border border-[#F0EBE3] rounded-2xl p-8 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A2E]">Situation en cours</p>
                    <p className="text-xs text-[#6B7280]">Inaptitude partielle · Depuis 3 mois</p>
                  </div>
                  <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">En cours</span>
                </div>
                {[
                  { label: 'Type', value: 'Inaptitude partielle' },
                  { label: 'Aménagements', value: 'Réduction temps de travail, télétravail 3j/sem' },
                  { label: 'Médecin du travail', value: 'Dossier saisi ✓' },
                  { label: 'SAMETH', value: 'Non contacté' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start text-sm border-b border-[#F0EBE3] pb-3 last:border-0 last:pb-0">
                    <span className="text-[#6B7280] text-xs">{label}</span>
                    <span className="text-[#1A1A2E] text-xs font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4, DOETH + Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
              <div className="lg:order-2">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-6 shadow-sm">
                  <FileText className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <h3 className="text-2xl xl:text-3xl font-black text-[#1A1A2E] mb-4">DOETH, budget et achats ESAT</h3>
                <p className="text-[#6B7280] leading-relaxed mb-7 text-lg">
                  Préparez votre déclaration DOETH pas à pas, suivez votre budget mission handicap par catégorie
                  et tracez vos achats ESAT/EA pour optimiser vos déductions légales.
                </p>
                <ul className="space-y-3">
                  {[
                    'Contribution brute et nette calculée automatiquement',
                    'Déductions ESAT/EA/TIH depuis vos achats enregistrés',
                    'Suivi du budget handicap par axe de dépense',
                    'Export Excel prêt pour votre gestionnaire de paie',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-[#1A1A2E]">
                      <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:order-1"><MockupDOETH /></div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MULTI-RÔLES ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">L&apos;équipe</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
              Conçu pour toute l&apos;équipe, du national au local.
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">
              Chaque collaborateur accède aux données de son périmètre. Le référent national voit tout.
              Le chargé de mission local voit son site. L&apos;admin pilote l&apos;accès de chacun.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                role: 'Administrateur',
                color: 'bg-[#EBF2FA] text-[#1E4A8C] border-blue-100',
                desc: 'Accès complet à l\'organisation. Gère les établissements, les paramètres OETH, les accès utilisateurs et la déclaration DOETH.',
              },
              {
                icon: UserCog,
                role: 'Référent(e) Handicap',
                color: 'bg-green-50 text-green-700 border-green-100',
                desc: 'Vision nationale sur tous les établissements. Pilote les indicateurs, le budget et les achats ESAT à l\'échelle de l\'organisation.',
              },
              {
                icon: Wallet,
                role: 'Chargé(e) de Mission',
                color: 'bg-purple-50 text-purple-700 border-purple-100',
                desc: 'Périmètre limité à son site. Saisit les BOETH, suit les maintiens dans l\'emploi et remonte les données de son établissement.',
              },
              {
                icon: TrendingUp,
                role: 'Lecteur',
                color: 'bg-[#F1F5F9] text-[#6B7280] border-slate-200',
                desc: 'Consultation en lecture seule des tableaux de bord et indicateurs de son périmètre, sans possibilité de modification.',
              },
            ].map(({ icon: Icon, role, color, desc }) => (
              <div key={role} className="p-7 bg-white rounded-2xl border border-[#E2E8F0] hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-bold text-[#1A1A2E] text-base mb-2">{role}</p>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────── */}
      <section id="fonctionnement" className="py-20 bg-[#FEFCF8] border-y border-[#F0EBE3]">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">Démarrage</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
              Opérationnel en moins de 10 minutes
            </h2>
            <p className="text-[#6B7280] text-lg">
              Pas de formation requise. Pas d&apos;intégration complexe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                title: 'Créez votre organisation',
                desc: 'Inscrivez-vous en 2 minutes. L\'onboarding guidé configure vos établissements, votre effectif et vos paramètres OETH dès la première connexion.',
              },
              {
                n: '02',
                title: 'Constituez votre équipe',
                desc: 'Invitez vos collaborateurs mission handicap et définissez leur rôle. Chaque chargé de mission n\'accède qu\'aux données de son site.',
              },
              {
                n: '03',
                title: 'Pilotez au quotidien',
                desc: 'Ajoutez vos salariés BOETH, suivez les maintiens dans l\'emploi, tracez vos achats ESAT et préparez votre DOETH en quelques clics.',
              },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex flex-col gap-5 p-8 bg-white rounded-2xl border border-[#F0EBE3] hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-xl font-black text-[#D97706]">{n}</span>
                </div>
                <div>
                  <p className="font-bold text-[#1A1A2E] mb-2 text-lg">{title}</p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DÉMO / FORMATION ─────────────────────────────────────────── */}
      <section id="demo" className="py-20 bg-[#FEFCF8] border-y border-[#F0EBE3]">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#D97706] uppercase tracking-widest mb-4">Démonstration</p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1A1A2E] mb-4">
              Vous préférez voir avant de vous lancer ?
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto text-lg">
              Rien de mieux qu&apos;une démonstration sur mesure pour comprendre comment Talenth
              s&apos;adapte à votre organisation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">

            {/* Colonne gauche : formulaire */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#EBF2FA] border border-blue-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-[#1E4A8C]" />
                </div>
                <div>
                  <p className="font-bold text-[#1A1A2E]">Planifier une démonstration</p>
                  <p className="text-sm text-[#6B7280]">En visio ou en présentiel, selon vos disponibilités</p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 shadow-sm">
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                  Décrivez-nous votre contexte en quelques mots et je vous recontacte
                  rapidement, généralement dans la journée, pour convenir d&apos;un créneau
                  adapté à votre agenda.
                </p>
                <FormDemo />
              </div>
            </div>

            {/* Colonne droite : placeholder vidéo + points forts */}
            <div className="flex flex-col gap-6">
              <div className="relative bg-[#0F1F3A] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E4A8C]/30 via-transparent to-transparent pointer-events-none" />
                <div className="relative text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <PlayCircle className="w-8 h-8 text-white/60" />
                  </div>
                  <p className="text-white/70 font-semibold text-base mb-1">Vidéo de démonstration</p>
                  <p className="text-white/35 text-sm">Disponible prochainement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Sur mesure', desc: 'On part de votre contexte, vos établissements, vos données réelles.' },
                  { title: 'Sans engagement', desc: '30 minutes suffisent pour avoir une vision complète de l\'outil.' },
                  { title: 'Toute l\'équipe', desc: 'Invitez vos chargés de mission ou votre DRH, c\'est ouvert.' },
                  { title: 'Accompagnement', desc: 'Je reste disponible par email après la démo pour toute question.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="bg-white border border-[#F0EBE3] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                      <p className="text-sm font-semibold text-[#1A1A2E]">{title}</p>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0F1F3A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0f00]/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <Heart className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[#F59E0B] text-xs font-semibold tracking-widest uppercase">Pour votre mission</span>
              </div>
              <h2 className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-white mb-6 leading-[1.06]">
                Prêts à donner à votre mission handicap les outils qu&apos;elle mérite ?
              </h2>
              <p className="text-white/60 text-xl mb-10 leading-relaxed">
                Rejoignez les équipes qui pilotent leur conformité OETH et leur politique
                d&apos;inclusion avec Talenth. Démarrez gratuitement, sans carte bancaire.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#D97706] transition-colors text-sm shadow-lg"
                >
                  Démarrer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:contact@talenth.fr"
                  className="inline-flex items-center justify-center border border-white/20 text-white/75 font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm"
                >
                  Demander une démonstration
                </a>
              </div>
              <p className="text-xs text-white/30 mt-6">
                10 jours d&apos;essai gratuit · Sans carte bancaire · Annulable à tout moment
              </p>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { value: '< 10 min', label: 'Pour être opérationnel' },
                { value: '6 %',      label: 'Quota légal OETH à atteindre' },
                { value: '4 rôles',  label: 'Du national au local' },
                { value: '0 €',      label: 'De contribution si le quota est atteint' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-7 text-center">
                  <p className="text-3xl xl:text-4xl font-black text-[#F59E0B] mb-2">{value}</p>
                  <p className="text-xs text-white/45 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FooterMarketing />
    </div>
  )
}
