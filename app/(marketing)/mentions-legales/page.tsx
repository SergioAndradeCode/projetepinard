import { Scale } from 'lucide-react'

export const metadata = {
  title: 'Mentions légales | Talenth',
  description: 'Mentions légales de la plateforme Talenth, conformément à la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l\'Économie Numérique (LCEN).',
}

const SECTIONS = [
  {
    id: 'editeur',
    title: '1. Éditeur du site',
    content: (
      <div className="space-y-2 text-sm text-[#374151] leading-relaxed">
        <p>Le site <strong>talenth.fr</strong> est édité par :</p>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-[#F0EBE3]">
            {[
              ['Dénomination sociale', 'Talenth'],
              ['Nom de l\'exploitant', 'Sergio De Andrade'],
              ['Forme juridique', 'Entreprise individuelle'],
              ['Siège social', '12 rue Georges Brassens, 91100 Corbeil-Essonnes'],
              ['SIRET', '99469898300024'],
              ['N° TVA intracommunautaire', 'FR19994698983'],
              ['Directeur de la publication', 'Sergio De Andrade'],
              ['Email de contact', 'talenthsupport@gmail.com'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className="py-2 pr-4 font-medium text-[#1A1A2E] w-56">{label}</td>
                <td className="py-2 text-[#6B7280]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[#9CA3AF]">
          Conformément à l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans
          l&apos;Économie Numérique (LCEN).
        </p>
      </div>
    ),
  },
  {
    id: 'hebergement',
    title: '2. Hébergement',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>Le site et ses données sont hébergés par :</p>
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
            <p className="font-semibold text-[#1A1A2E] mb-1">Application web, Vercel Inc.</p>
            <p className="text-[#6B7280]">440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
            <p className="text-[#6B7280]">Site : <a href="https://vercel.com" className="text-[#1E4A8C] hover:underline">vercel.com</a></p>
            <p className="text-xs text-[#9CA3AF] mt-1">Infrastructure sous-jacente : datacenters européens (AWS eu-west).</p>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
            <p className="font-semibold text-[#1A1A2E] mb-1">Base de données, Supabase Inc.</p>
            <p className="text-[#6B7280]">970 Toa Payoh North #07-04, Singapore 318992</p>
            <p className="text-[#6B7280]">Site : <a href="https://supabase.com" className="text-[#1E4A8C] hover:underline">supabase.com</a></p>
            <p className="text-xs text-[#9CA3AF] mt-1">Région de stockage : Europe de l&apos;Ouest (Frankfurt, Allemagne, Union européenne). Conforme au RGPD.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'propriete',
    title: '3. Propriété intellectuelle',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>
          L&apos;ensemble des éléments composant le site Talenth (marque, logo, textes, graphismes, interface,
          code source, structure) est la propriété exclusive de Talenth et est protégé par les dispositions
          du Code de la propriété intellectuelle (articles L111-1 et suivants).
        </p>
        <p>
          Toute reproduction, représentation, utilisation ou adaptation, sous quelque forme que ce soit,
          de tout ou partie des éléments du site, sans l&apos;accord écrit préalable de Talenth, est strictement
          interdite et constituerait une contrefaçon sanctionnée par les articles L335-2 et suivants du
          Code de la propriété intellectuelle.
        </p>
        <p>
          Les marques et logos figurant sur le site sont des marques déposées ou en cours de dépôt.
          Toute utilisation non autorisée expose son auteur à des poursuites judiciaires.
        </p>
      </div>
    ),
  },
  {
    id: 'responsabilite',
    title: '4. Limitation de responsabilité',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>
          Talenth met tout en œuvre pour assurer l&apos;exactitude et la mise à jour des informations diffusées
          sur son site. Toutefois, Talenth ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité
          des informations mises à disposition sur le site.
        </p>
        <p>
          En conséquence, Talenth décline toute responsabilité pour toute imprécision, inexactitude ou
          omission portant sur des informations disponibles sur le site, ainsi que pour tous dommages
          résultant d&apos;une intrusion frauduleuse d&apos;un tiers ayant entraîné une modification des informations
          mises à disposition sur le site.
        </p>
        <p>
          Les calculs OETH fournis par la plateforme ont une valeur indicative. L&apos;utilisateur reste seul
          responsable des déclarations officielles qu&apos;il effectue auprès de l&apos;URSSAF ou de tout autre
          organisme compétent.
        </p>
      </div>
    ),
  },
  {
    id: 'liens',
    title: '5. Liens hypertextes',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>
          Le site peut contenir des liens vers d&apos;autres sites internet. Talenth n&apos;exerce aucun contrôle
          sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou leurs
          pratiques en matière de confidentialité.
        </p>
        <p>
          Tout lien hypertexte pointant vers le site talenth.fr doit faire l&apos;objet d&apos;une autorisation
          préalable de Talenth. Pour toute demande : <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>.
        </p>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>
          Le site Talenth utilise des cookies strictement nécessaires au fonctionnement de la plateforme
          (session d&apos;authentification, préférences utilisateur). Aucun cookie de suivi publicitaire ou
          d&apos;analyse comportementale n&apos;est déposé sans votre consentement préalable.
        </p>
        <p>
          Conformément à la loi n° 78-17 du 6 janvier 1978 modifiée et aux recommandations de la CNIL,
          vous pouvez configurer votre navigateur pour refuser les cookies. La désactivation des cookies
          nécessaires au fonctionnement du service peut toutefois altérer votre expérience.
        </p>
      </div>
    ),
  },
  {
    id: 'droit',
    title: '7. Droit applicable et juridiction',
    content: (
      <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
        <p>
          Les présentes mentions légales sont soumises au droit français. Tout litige relatif à
          l&apos;utilisation du site talenth.fr relève de la compétence exclusive des tribunaux français
          compétents.
        </p>
        <p>
          En cas de litige avec Talenth, l&apos;utilisateur est invité à prendre contact préalablement à toute
          procédure judiciaire à l&apos;adresse suivante : <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] hover:underline">talenthsupport@gmail.com</a>.
        </p>
      </div>
    ),
  },
]

export default function MentionsLegalesPage() {
  return (
    <div className="pt-24 pb-20">

      {/* Hero */}
      <section className="py-14 text-center border-b border-[#F0EBE3]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EBF2FA] rounded-2xl mb-5">
            <Scale className="w-5 h-5 text-[#1E4A8C]" />
          </div>
          <p className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-3">Légal</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-4">Mentions légales</h1>
          <p className="text-[#6B7280] leading-relaxed">
            Conformément à la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie
            Numérique (LCEN), nous vous informons des éléments suivants.
          </p>
          <p className="text-xs text-[#9CA3AF] mt-4">Dernière mise à jour : mai 2026</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <div className="space-y-10">
          {SECTIONS.map(({ id, title, content }) => (
            <div key={id} id={id} className="scroll-mt-24">
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 pb-2 border-b border-[#F0EBE3]">{title}</h2>
              {content}
            </div>
          ))}
        </div>

        <div className="mt-14 p-6 bg-[#FEFCF8] border border-[#F0EBE3] rounded-2xl text-center">
          <p className="text-sm text-[#6B7280] mb-2">Une question sur ces mentions légales ?</p>
          <a href="mailto:talenthsupport@gmail.com" className="text-[#1E4A8C] font-semibold text-sm hover:underline">
            talenthsupport@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}
