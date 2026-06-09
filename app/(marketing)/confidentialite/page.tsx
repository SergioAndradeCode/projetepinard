import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Politique de confidentialité | Talenth',
  description: 'Politique de confidentialité et protection des données personnelles de Talenth, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.',
}

export default function ConfidentialitePage() {
  return (
    <div className="pt-24 pb-20">

      {/* Hero */}
      <section className="py-14 text-center border-b border-[#F0EBE3]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EBF2FA] rounded-2xl mb-5">
            <ShieldCheck className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-3">Protection des données</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            Talenth s&apos;engage à protéger la vie privée de ses utilisateurs et à traiter les données
            personnelles dans le strict respect du droit applicable.
          </p>
          <p className="text-xs text-[#9CA3AF] mt-4">Dernière mise à jour : mai 2026</p>
        </div>
      </section>

      {/* Encadré règlements applicables */}
      <section className="max-w-3xl mx-auto px-6 pt-10">
        <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-2xl p-6 mb-10">
          <p className="text-xs font-bold text-[#1E4A8C] uppercase tracking-widest mb-3">Textes de référence</p>
          <ul className="space-y-1.5 text-sm text-[#374151]">
            {[
              'Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD)',
              'Loi n° 78-17 du 6 janvier 1978 relative à l\'informatique, aux fichiers et aux libertés, modifiée par la loi n° 2018-493 du 20 juin 2018',
              'Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l\'Économie Numérique (LCEN)',
              'Article 9 du RGPD : Traitement des catégories particulières de données (données de santé)',
              'Articles 12 à 22 du RGPD : Droits des personnes concernées',
              'Article 28 du RGPD : Sous-traitant',
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

          {/* 1 */}
          <div id="responsable" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              1. Responsable du traitement
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Le responsable du traitement de vos données personnelles est <strong>Sergio De Andrade</strong>,
                exploitant la plateforme <strong>Talenth</strong> en qualité d&apos;entrepreneur individuel (SIRET&nbsp;:&nbsp;99469898300024),
                joignable à l&apos;adresse <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>.
              </p>
              <p>
                Dans le cadre des données relatives aux salariés de vos organisations (données BOETH,
                maintien dans l&apos;emploi, etc.), <strong>votre entreprise reste responsable de traitement</strong>{' '}
                au sens de l&apos;article 4§7 du RGPD, et Talenth agit en qualité de <strong>sous-traitant</strong>{' '}
                conformément à l&apos;article 28 du RGPD. Les conditions de cette sous-traitance sont précisées
                à l&apos;article 10 de la présente politique.
              </p>
            </div>
          </div>

          {/* 2 */}
          <div id="donnees-collectees" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              2. Données collectées
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-4">
              <p>Talenth collecte les catégories de données suivantes :</p>

              <div className="space-y-3">
                {[
                  {
                    cat: 'Données de compte (utilisateurs)',
                    items: ['Nom et prénom', 'Adresse email professionnelle', 'Nom de l\'organisation', 'Rôle au sein de l\'organisation'],
                    basis: 'Exécution du contrat (art. 6§1b RGPD)',
                  },
                  {
                    cat: 'Données de facturation',
                    items: ['Informations de paiement (traitées exclusivement par Stripe | Talenth ne stocke pas de données bancaires)', 'Historique des transactions'],
                    basis: 'Obligation légale / exécution du contrat (art. 6§1b et 6§1c RGPD)',
                  },
                  {
                    cat: 'Données relatives aux salariés BOETH',
                    items: [
                      'Nom, prénom, date de naissance (requise pour le calcul du coefficient senior OETH : art. L5212-2 C. trav. : coefficient ×1,5 dès 50 ans)',
                      'Numéro de sécurité sociale (optionnel)',
                      'Type et dates de reconnaissance (RQTH, AAH, pension d\'invalidité, rente AT/MP…)',
                      'Taux d\'emploi à temps partiel, établissement de rattachement',
                    ],
                    basis: 'Obligation légale pesant sur l\'employeur (art. 6§1c RGPD), art. L5212-1 et s. du Code du travail (OETH)',
                    special: true,
                  },
                  {
                    cat: 'Données de maintien dans l\'emploi',
                    items: [
                      'Nature de la situation (AT/MP, inaptitude, maladie longue durée…)',
                      'Aménagements de poste, intervenants extérieurs (médecin du travail, SAMETH, Cap Emploi)',
                      'Statut d\'évolution de la situation',
                    ],
                    basis: 'Obligation légale pesant sur l\'employeur (art. 6§1c RGPD) + intérêt légitime à la traçabilité (art. 6§1f RGPD)',
                    special: true,
                  },
                  {
                    cat: 'Données techniques',
                    items: ['Adresse IP', 'Journaux de connexion', 'Préférences de navigation'],
                    basis: 'Intérêt légitime à la sécurité (art. 6§1f RGPD)',
                  },
                ].map(({ cat, items, basis, special }) => (
                  <div key={cat} className={`rounded-xl border p-4 ${special ? 'bg-amber-50 border-amber-100' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <p className="font-semibold text-[#1A1A2E] text-sm">{cat}</p>
                      {special && (
                        <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          Données de santé, art. 9 RGPD
                        </span>
                      )}
                    </div>
                    <ul className="space-y-0.5 mb-2">
                      {items.map(i => (
                        <li key={i} className="text-xs text-[#6B7280] flex items-start gap-1.5">
                          <span className="mt-1 shrink-0">·</span>{i}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#1E4A8C] font-medium">Base légale : {basis}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 */}
          <div id="donnees-sante" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              3. Traitement des données de santé
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="font-semibold text-[#1A1A2E] mb-2">Catégorie particulière au sens de l&apos;article 9 du RGPD</p>
                <p>
                  Les reconnaissances de la qualité de travailleur handicapé (RQTH), les rentes
                  accident du travail / maladie professionnelle (AT/MP), les pensions d&apos;invalidité et
                  les informations relatives aux inaptitudes constituent des <strong>données révélant l&apos;état de
                  santé</strong> au sens de l&apos;article 9§1 du RGPD.
                </p>
              </div>
              <p>
                Leur traitement est autorisé sur le fondement de l&apos;article 9§2(b) du RGPD :
                &laquo;&thinsp;le traitement est nécessaire aux fins de l&apos;exécution des obligations et de l&apos;exercice
                des droits propres au responsable du traitement ou à la personne concernée en matière
                de droit du travail&thinsp;&raquo;, en l&apos;espèce, l&apos;Obligation d&apos;Emploi des Travailleurs Handicapés
                (OETH) prévue aux articles L5212-1 à L5212-4 du Code du travail.
              </p>
              <p>
                Votre organisation, en tant que responsable de traitement, doit s&apos;assurer que les
                salariés concernés sont informés du traitement de leurs données dans ce cadre,
                conformément aux articles 13 et 14 du RGPD, et que ce traitement figure dans votre
                registre des activités de traitement (article 30 RGPD).
              </p>
              <p>
                Talenth recommande à toute organisation traitant un volume significatif de données
                de santé de réaliser une <strong>Analyse d&apos;Impact relative à la Protection des Données (AIPD)</strong>{' '}
                conformément à l&apos;article 35 du RGPD et aux lignes directrices de la CNIL.
              </p>
            </div>
          </div>

          {/* 4 */}
          <div id="finalites" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              4. Finalités du traitement
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed">
              <p className="mb-3">Les données sont traitées exclusivement aux fins suivantes :</p>
              <ul className="space-y-2">
                {[
                  'Fourniture du service Talenth (gestion OETH, suivi BOETH, maintien dans l\'emploi, DOETH)',
                  'Création et gestion de votre compte utilisateur',
                  'Facturation et gestion de l\'abonnement',
                  'Assistance technique et support',
                  'Amélioration du service (données agrégées et anonymisées uniquement)',
                  'Respect de nos obligations légales et comptables',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#D97706] mt-1 shrink-0 font-bold">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[#6B7280]">
                Aucune donnée n&apos;est utilisée à des fins de démarchage commercial ou de profilage
                publicitaire.
              </p>
            </div>
          </div>

          {/* 5 */}
          <div id="conservation" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              5. Durée de conservation
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Type de données</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {[
                      ['Données de compte utilisateur', 'Durée de l\'abonnement + 3 ans après résiliation'],
                      ['Données BOETH et maintien dans l\'emploi', 'Durée de l\'abonnement + 5 ans (prescription civile, art. 2224 C. civ.)'],
                      ['Données de facturation', '10 ans (obligation comptable, art. L123-22 C. com.)'],
                      ['Journaux de connexion', '12 mois (recommandation CNIL)'],
                      ['Données supprimées à la demande', 'Suppression effective sous 30 jours'],
                    ].map(([type, duree]) => (
                      <tr key={type} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-[#374151]">{type}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{duree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6 */}
          <div id="destinataires" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              6. Destinataires des données
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <p>
                Vos données sont accessibles exclusivement aux membres de votre organisation disposant
                d&apos;un accès Talenth selon les droits qui leur ont été attribués.
              </p>
              <p>Talenth fait appel aux sous-traitants techniques suivants, tous liés par des clauses
              contractuelles conformes à l&apos;article 28 du RGPD :</p>
              <div className="space-y-2">
                {[
                  { name: 'Supabase Inc.', role: 'Hébergement de la base de données', location: 'UE (Frankfurt)' },
                  { name: 'Vercel Inc.', role: 'Hébergement de l\'application web', location: 'UE (AWS eu-west)' },
                  { name: 'Stripe Inc.', role: 'Traitement des paiements', location: 'UE, certifié PCI-DSS' },
                ].map(({ name, role, location }) => (
                  <div key={name} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs">
                    <span className="font-semibold text-[#1A1A2E]">{name}</span>
                    <span className="text-[#6B7280]">{role}</span>
                    <span className="text-[#1E4A8C] font-medium">{location}</span>
                  </div>
                ))}
              </div>
              <p>
                Aucune donnée n&apos;est vendue, louée ou transmise à des tiers à des fins commerciales.
                Talenth peut communiquer des données si une obligation légale l&apos;y contraint (réquisition
                judiciaire, etc.).
              </p>
            </div>
          </div>

          {/* 7 */}
          <div id="droits" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              7. Vos droits
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <p>
                Conformément aux articles 12 à 22 du RGPD, vous disposez des droits suivants sur
                vos données personnelles :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { droit: 'Droit d\'accès', desc: 'Obtenir une copie des données vous concernant (art. 15 RGPD)', ref: 'Art. 15' },
                  { droit: 'Droit de rectification', desc: 'Corriger des données inexactes ou incomplètes (art. 16 RGPD)', ref: 'Art. 16' },
                  { droit: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données ("droit à l\'oubli") (art. 17 RGPD)', ref: 'Art. 17' },
                  { droit: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré et lisible (art. 20 RGPD)', ref: 'Art. 20' },
                  { droit: 'Droit d\'opposition', desc: 'Vous opposer à certains traitements fondés sur l\'intérêt légitime (art. 21 RGPD)', ref: 'Art. 21' },
                  { droit: 'Droit à la limitation', desc: 'Demander le gel temporaire du traitement (art. 18 RGPD)', ref: 'Art. 18' },
                ].map(({ droit, desc, ref }) => (
                  <div key={droit} className="bg-[#FEFCF8] border border-[#F0EBE3] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[#1A1A2E] text-xs">{droit}</p>
                      <span className="text-[10px] bg-[#EBF2FA] text-[#1E4A8C] px-2 py-0.5 rounded-full">{ref}</span>
                    </div>
                    <p className="text-xs text-[#6B7280]">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#EBF2FA] border border-[#1E4A8C]/20 rounded-xl p-5 mt-2">
                <p className="font-semibold text-[#1A1A2E] mb-2 text-sm">Exercer vos droits</p>
                <p className="text-sm text-[#374151]">
                  Toute demande doit être adressée à{' '}
                  <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] font-medium hover:underline">
                    talenthsupport@gmail.com
                  </a>{' '}
                  en précisant votre identité. Talenth s&apos;engage à répondre dans un délai maximum de{' '}
                  <strong>30 jours</strong> conformément à l&apos;article 12§3 du RGPD.
                </p>
                <p className="text-sm text-[#374151] mt-2">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
                  réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :
                  <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-[#1E4A8C] hover:underline ml-1">cnil.fr/fr/plaintes</a>.
                </p>
              </div>
            </div>
          </div>

          {/* 8 */}
          <div id="securite" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              8. Sécurité des données
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Conformément à l&apos;article 32 du RGPD, Talenth met en œuvre les mesures techniques
                et organisationnelles appropriées pour garantir la sécurité des données :
              </p>
              <ul className="space-y-1.5 mt-2">
                {[
                  'Chiffrement des données en transit (HTTPS/TLS 1.3) et au repos (AES-256)',
                  'Authentification sécurisée avec hachage des mots de passe (bcrypt)',
                  'Contrôle d\'accès basé sur les rôles (RBAC), Row Level Security Supabase',
                  'Journalisation des accès et des modifications',
                  'Hébergement en Union européenne',
                  'Sauvegardes quotidiennes chiffrées',
                ].map(m => (
                  <li key={m} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 shrink-0 font-bold">✓</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[#6B7280]">
                En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits et
                libertés, Talenth notifiera la CNIL dans les 72 heures conformément à l&apos;article 33 du
                RGPD, et vous en informera sans délai injustifié (art. 34 RGPD).
              </p>
            </div>
          </div>

          {/* 9 */}
          <div id="suppression" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              9. Suppression de votre compte
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <p>
                Vous pouvez demander la suppression complète de votre compte et de l&apos;ensemble des
                données associées à tout moment en envoyant un email à{' '}
                <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>{' '}
                avec l&apos;objet : <strong>&ldquo;Suppression de compte&rdquo;</strong>.
              </p>
              <p>
                La suppression sera effectuée dans un délai de <strong>30 jours</strong>. Certaines données
                pourront être conservées au-delà de ce délai si une obligation légale l&apos;exige (données
                de facturation notamment, voir article 5).
              </p>
              <p>
                Avant suppression, vous pouvez exporter l&apos;ensemble de vos données via les fonctions
                d&apos;export Excel disponibles dans la plateforme.
              </p>
            </div>
          </div>

          {/* 10, DPA */}
          <div id="sous-traitance" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              10. Accord de sous-traitance des données (DPA)
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="font-semibold text-[#1A1A2E] mb-2">Article 28 RGPD : Obligations du sous-traitant</p>
                <p>
                  En utilisant Talenth, votre organisation (responsable de traitement) confie à Talenth
                  (sous-traitant) le traitement de données personnelles relatives à vos salariés.
                  Les présentes clauses constituent l&apos;accord de sous-traitance requis par l&apos;article 28
                  du RGPD.
                </p>
              </div>
              <p><strong>Talenth s&apos;engage à :</strong></p>
              <ul className="space-y-1.5">
                {[
                  'Traiter les données personnelles uniquement sur instructions documentées du responsable de traitement',
                  'Garantir que les personnes autorisées à traiter les données sont soumises à une obligation de confidentialité',
                  'Prendre toutes les mesures de sécurité requises par l\'article 32 du RGPD',
                  'Ne pas recruter d\'autre sous-traitant sans autorisation préalable écrite du responsable de traitement (nos sous-traitants actuels sont listés à l\'article 6)',
                  'Aider le responsable de traitement à répondre aux demandes d\'exercice de droits des personnes concernées',
                  'Supprimer ou restituer toutes les données personnelles à l\'issue de la prestation',
                  'Mettre à disposition toutes les informations nécessaires pour démontrer le respect des obligations du présent article',
                ].map(o => (
                  <li key={o} className="flex items-start gap-2">
                    <span className="text-[#1E4A8C] mt-1 shrink-0 font-bold">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#6B7280]">
                Pour toute demande relative au DPA ou à un accord de sous-traitance formalisé,
                contactez <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>.
              </p>
            </div>
          </div>

          {/* 11, Cookies */}
          <div id="cookies" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              11. Cookies et traceurs
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed space-y-3">
              <p>
                Conformément à la loi n° 78-17 du 6 janvier 1978 modifiée et aux recommandations
                de la CNIL (délibération n° 2020-091 du 17 septembre 2020), voici les cookies déposés
                par Talenth :
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Cookie</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Finalité</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Durée</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E]">Consentement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {[
                      ['sb-* (Supabase)', 'Session d\'authentification, maintien de la connexion', 'Session / 7 jours', 'Exempt (technique nécessaire)'],
                      ['talenth_cookie_notice_v1', 'Mémorisation de la fermeture de la notice cookies', 'Persistant (localStorage)', 'Exempt (technique nécessaire)'],
                    ].map(([name, purpose, duration, consent]) => (
                      <tr key={name} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-mono text-xs text-[#1A1A2E]">{name}</td>
                        <td className="px-4 py-3 text-[#374151]">{purpose}</td>
                        <td className="px-4 py-3 text-[#6B7280] text-xs">{duration}</td>
                        <td className="px-4 py-3 text-xs text-green-700 font-medium">{consent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800">
                <strong>Aucun cookie publicitaire, analytique ou de profilage.</strong> Talenth n&apos;utilise ni
                Google Analytics, ni Hotjar, ni aucun outil de tracking comportemental.
                Les cookies présents sont strictement nécessaires au fonctionnement du service et
                exemptés de consentement préalable au titre de l&apos;article 82 de la loi Informatique et Libertés.
              </div>
            </div>
          </div>

          {/* 12 */}
          <div id="modifications" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">
              12. Modifications de la présente politique
            </h2>
            <div className="text-sm text-[#374151] leading-relaxed">
              <p>
                Talenth se réserve le droit de modifier la présente politique à tout moment, notamment
                pour se conformer à d&apos;éventuelles évolutions législatives ou réglementaires. En cas de
                modification substantielle, les utilisateurs seront notifiés par email au moins 30 jours
                avant l&apos;entrée en vigueur des nouvelles dispositions.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-14 p-6 bg-[#FEFCF8] border border-[#F0EBE3] rounded-2xl text-center">
          <p className="text-sm text-[#6B7280] mb-1">Questions relatives à la protection de vos données ?</p>
          <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] font-semibold text-sm hover:underline">
            talenthsupport@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}
