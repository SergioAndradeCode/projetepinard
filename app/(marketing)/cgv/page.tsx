import { FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'CGV / CGU | Talenth',
  description: 'Conditions Générales de Vente et d\'Utilisation de la plateforme Talenth.',
}

export default function CGVPage() {
  return (
    <div className="pt-24 pb-20">

      {/* Hero */}
      <section className="py-14 text-center border-b border-[#F0EBE3]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EBF2FA] rounded-2xl mb-5">
            <FileText className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-3">Contractuel</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-4">
            Conditions Générales de Vente<br />et d&apos;Utilisation
          </h1>
          <p className="text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            Les présentes CGV/CGU régissent l&apos;utilisation de la plateforme Talenth et constituent
            le contrat entre Talenth et ses clients.
          </p>
          <p className="text-xs text-[#9CA3AF] mt-4">Dernière mise à jour : mai 2026</p>
        </div>
      </section>

      {/* Encadré */}
      <section className="max-w-3xl mx-auto px-6 pt-10">
        <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-2xl p-6 mb-10">
          <p className="text-xs font-bold text-[#1E4A8C] uppercase tracking-widest mb-3">Textes de référence</p>
          <ul className="space-y-1.5 text-sm text-[#374151]">
            {[
              'Code de la consommation, articles L111-1, L221-1 et suivants',
              'Code civil, articles 1101 et suivants (droit des contrats)',
              'Règlement (UE) 2016/679 du 27 avril 2016 (RGPD), article 28 (sous-traitance)',
              'Loi n° 2004-575 du 21 juin 2004 (LCEN)',
              'Loi n° 2008-776 du 4 août 2008 de modernisation de l\'économie (LME), délais de paiement',
            ].map(t => (
              <li key={t} className="flex items-start gap-2">
                <span className="text-[#1E4A8C] mt-1 shrink-0">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Corps */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="space-y-12">

          <div id="objet" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">1. Objet</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Les présentes Conditions Générales de Vente et d&apos;Utilisation (ci-après &laquo;&thinsp;CGV/CGU&thinsp;&raquo;) ont pour
                objet de définir les conditions dans lesquelles Talenth fournit à ses clients (ci-après
                &laquo;&thinsp;le Client&thinsp;&raquo;) un accès à la plateforme SaaS de gestion de l&apos;Obligation d&apos;Emploi des
                Travailleurs Handicapés (OETH) accessible à l&apos;adresse <strong>talenth.fr</strong>.
              </p>
              <p>
                Toute utilisation de la plateforme implique l&apos;acceptation pleine et entière des
                présentes CGV/CGU. Le Client déclare avoir pris connaissance des présentes conditions
                et les accepter sans réserve lors de la création de son compte.
              </p>
            </div>
          </div>

          <div id="service" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">2. Description du service</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>Talenth est une plateforme SaaS (Software as a Service) qui permet à ses clients de :</p>
              <ul className="space-y-1.5 mt-2">
                {[
                  'Calculer et suivre leur taux OETH et leurs unités bénéficiaires',
                  'Gérer les dossiers de leurs salariés bénéficiaires de l\'obligation d\'emploi (BOETH)',
                  'Suivre les situations de maintien dans l\'emploi',
                  'Préparer la Déclaration Obligatoire d\'Emploi des Travailleurs Handicapés (DOETH)',
                  'Gérer le budget mission handicap et les achats ESAT/EA',
                  'Coordonner une équipe multi-sites avec des accès à différents niveaux',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#D97706] mt-1 shrink-0 font-bold">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[#6B7280]">
                Les calculs fournis par Talenth ont une valeur indicative. Le Client reste seul
                responsable de ses déclarations officielles auprès des organismes compétents
                (URSSAF, DGEFP, etc.).
              </p>
            </div>
          </div>

          <div id="compte" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">3. Création de compte et accès</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                L&apos;accès à la plateforme nécessite la création d&apos;un compte en renseignant des informations
                exactes, complètes et à jour. Le Client est seul responsable de la confidentialité de
                ses identifiants et de toute utilisation faite de son compte.
              </p>
              <p>
                Talenth se réserve le droit de suspendre ou de résilier tout compte en cas de
                fourniture d&apos;informations inexactes, d&apos;utilisation frauduleuse ou contraire aux présentes
                conditions.
              </p>
              <p>
                Le Client est responsable de la gestion des accès accordés aux membres de son
                organisation. Il lui appartient de révoquer les accès des utilisateurs qui quittent
                l&apos;organisation ou changent de fonction.
              </p>
            </div>
          </div>

          <div id="essai" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">4. Période d&apos;essai</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Tout nouveau compte bénéficie d&apos;une <strong>période d&apos;essai gratuite de 10 jours</strong> à
                compter de la date de création du compte, donnant accès à l&apos;ensemble des fonctionnalités
                de la plateforme.
              </p>
              <p>
                Aucun moyen de paiement n&apos;est requis pour démarrer l&apos;essai. À l&apos;issue de la période
                d&apos;essai, le compte passe automatiquement en mode lecture seule si aucun abonnement
                n&apos;a été souscrit. Aucun prélèvement automatique n&apos;est effectué.
              </p>
              <p>
                Les données saisies pendant la période d&apos;essai sont conservées pendant <strong>30 jours</strong>{' '}
                après son expiration, afin de permettre au Client de souscrire un abonnement et de
                retrouver ses données.
              </p>
            </div>
          </div>

          <div id="tarifs" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">5. Tarifs et facturation</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <p>
                Les tarifs en vigueur sont ceux affichés sur la page{' '}
                <Link href="/tarifs" className="text-[#1E4A8C] hover:underline">talenth.fr/tarifs</Link>{' '}
                au moment de la souscription. Tous les prix sont indiqués <strong>hors taxes (HT)</strong>.
                La TVA applicable est de 20%.
              </p>
              <p>
                La plateforme propose deux cycles de facturation :
              </p>
              <div className="space-y-2">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                  <p className="font-semibold text-[#1A1A2E] mb-1">Mensuel (sans engagement)</p>
                  <p className="text-[#6B7280]">Facturation mensuelle. Résiliable à tout moment, avec prise d&apos;effet à la fin de la période en cours.</p>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                  <p className="font-semibold text-[#1A1A2E] mb-1">Annuel mensuel (−15%)</p>
                  <p className="text-[#6B7280]">Facturation mensuelle avec engagement sur 12 mois. Résiliable avant le renouvellement annuel. Le tarif mensuel bénéficie d&apos;une réduction de 15% par rapport au mensuel sans engagement.</p>
                </div>
              </div>
              <p>
                Le paiement s&apos;effectue par carte bancaire ou prélèvement SEPA via Stripe. Les factures
                sont disponibles dans l&apos;espace client. En cas de défaut de paiement, Talenth se réserve
                le droit de suspendre l&apos;accès au service après mise en demeure restée infructueuse
                pendant 15 jours.
              </p>
              <p>
                Talenth se réserve le droit de modifier ses tarifs avec un préavis de <strong>30 jours</strong>.
                Les modifications tarifaires n&apos;affectent pas les abonnements en cours jusqu&apos;à leur
                prochain renouvellement.
              </p>
            </div>
          </div>

          <div id="resiliation" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">6. Résiliation</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                <strong>Résiliation par le Client :</strong> Le Client peut résilier son abonnement à tout moment
                depuis l&apos;espace Paramètres &rsaquo; Facturation ou en contactant{' '}
                <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>.
                Pour les abonnements mensuels, la résiliation prend effet à la fin de la période mensuelle
                en cours. Pour les abonnements annuels, elle prend effet à la date de renouvellement annuel.
              </p>
              <p>
                <strong>Résiliation par Talenth :</strong> Talenth peut résilier l&apos;abonnement du Client en cas
                de violation grave des présentes CGV/CGU, avec un préavis de 15 jours sauf en cas de
                manquement grave (fraude, utilisation illicite), auquel cas la résiliation peut être
                immédiate.
              </p>
              <p>
                En cas de résiliation, le Client dispose de <strong>30 jours</strong> pour exporter ses données
                avant leur suppression définitive.
              </p>
            </div>
          </div>

          <div id="obligations" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">7. Obligations du Client</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>Le Client s&apos;engage à :</p>
              <ul className="space-y-1.5 mt-2">
                {[
                  'Utiliser la plateforme conformément à sa destination et à la législation en vigueur',
                  'Ne pas tenter de contourner les mesures de sécurité de la plateforme',
                  'Informer les salariés concernés du traitement de leurs données personnelles dans le cadre de l\'OETH, conformément aux articles 13 et 14 du RGPD',
                  'Maintenir à jour les informations de son compte et les données saisies',
                  'Ne pas partager ses identifiants avec des tiers extérieurs à son organisation',
                  'Respecter la propriété intellectuelle de Talenth',
                ].map(o => (
                  <li key={o} className="flex items-start gap-2">
                    <span className="text-[#D97706] mt-1 shrink-0 font-bold">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="obligations-talenth" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">8. Obligations de Talenth</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>Talenth s&apos;engage à :</p>
              <ul className="space-y-1.5 mt-2">
                {[
                  'Fournir un service disponible et fonctionnel avec un objectif de disponibilité de 99,5% (hors maintenances planifiées)',
                  'Informer le Client de toute maintenance planifiée avec un préavis raisonnable',
                  'Assurer la sécurité et la confidentialité des données conformément à la politique de confidentialité',
                  'Mettre à jour les paramètres légaux OETH (SMIC de référence, seuils) chaque année',
                  'Répondre aux demandes de support dans un délai de 48 heures ouvrées',
                ].map(o => (
                  <li key={o} className="flex items-start gap-2">
                    <span className="text-[#1E4A8C] mt-1 shrink-0 font-bold">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="responsabilite" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">9. Responsabilité et garanties</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <p>
                Talenth fournit un service d&apos;aide à la gestion OETH. Les calculs et indicateurs produits
                ont une valeur <strong>indicative</strong>. Talenth ne saurait être tenu responsable des erreurs
                de déclaration du Client auprès des organismes officiels.
              </p>
              <p>
                La responsabilité de Talenth est limitée aux dommages directs et ne peut excéder le
                montant des sommes versées par le Client au cours des 12 derniers mois précédant le
                fait générateur du dommage.
              </p>
              <p>
                Talenth ne saurait être tenu responsable de tout dommage indirect (perte de données,
                manque à gagner, atteinte à l&apos;image) résultant de l&apos;utilisation ou de l&apos;impossibilité
                d&apos;utiliser la plateforme.
              </p>
              <p>
                En cas d&apos;interruption de service, Talenth s&apos;engage à mettre tout en œuvre pour
                rétablir l&apos;accès dans les meilleurs délais.
              </p>
            </div>
          </div>

          <div id="donnees" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">10. Protection des données personnelles</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Le traitement des données personnelles effectué dans le cadre des présentes CGV/CGU est
                régi par la{' '}
                <Link href="/confidentialite" className="text-[#1E4A8C] hover:underline">
                  Politique de confidentialité de Talenth
                </Link>
                , qui constitue un accord de sous-traitance au sens de l&apos;article 28 du RGPD et fait
                partie intégrante des présentes CGV/CGU.
              </p>
              <p>
                En acceptant les présentes CGV/CGU, le Client accepte expressément les clauses
                de sous-traitance des données décrites dans ladite politique.
              </p>
            </div>
          </div>

          <div id="pi" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">11. Propriété intellectuelle</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                La plateforme Talenth, son code source, son interface, ses algorithmes de calcul et tous
                les éléments qui la composent sont la propriété exclusive de Talenth et sont protégés
                par le droit de la propriété intellectuelle.
              </p>
              <p>
                L&apos;abonnement confère au Client un droit d&apos;utilisation personnel, non exclusif et non
                cessible de la plateforme pour ses besoins propres. Toute autre utilisation, notamment
                toute reproduction, revente ou extraction du code source, est strictement interdite.
              </p>
              <p>
                Les données saisies par le Client dans la plateforme restent sa propriété exclusive.
                Talenth ne revendique aucun droit sur ces données.
              </p>
            </div>
          </div>

          <div id="droit-applicable" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">12. Droit applicable et règlement des litiges</h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Les présentes CGV/CGU sont soumises au <strong>droit français</strong>. En cas de litige, les
                parties s&apos;efforceront de trouver une solution amiable. À défaut, le litige sera soumis
                à la compétence exclusive du <strong>Tribunal de commerce de Paris</strong>.
              </p>
              <p>
                Pour tout litige ou réclamation, le Client est invité à contacter Talenth en priorité à
                l&apos;adresse{' '}
                <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">
                  talenthsupport@gmail.com
                </a>.
              </p>
            </div>
          </div>

          <div id="modifications" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">13. Modifications des CGV/CGU</h2>
            <div className="text-sm text-[#374151] leading-relaxed">
              <p>
                Talenth se réserve le droit de modifier les présentes CGV/CGU à tout moment. Les
                modifications substantielles seront notifiées aux Clients par email avec un préavis
                de <strong>30 jours</strong>. La poursuite de l&apos;utilisation du service après ce délai vaut
                acceptation des nouvelles conditions. En cas de refus, le Client peut résilier son
                abonnement sans frais.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-14 p-6 bg-[#FEFCF8] border border-[#F0EBE3] rounded-2xl text-center">
          <p className="text-sm text-[#6B7280] mb-1">Une question sur ces conditions ?</p>
          <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] font-semibold text-sm hover:underline">
            talenthsupport@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}
