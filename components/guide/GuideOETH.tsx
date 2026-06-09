'use client'

import React, { useState } from 'react'
import {
  BookOpen, Calculator, Receipt, FileText,
  AlertTriangle, CheckCircle, Info, ChevronRight,
  Building2, Users, Euro, Calendar,
} from 'lucide-react'

type Tab = 'essentiel' | 'calcul' | 'deductions' | 'dsn'

const TABS = [
  { id: 'essentiel' as Tab, label: "L'essentiel", icon: BookOpen },
  { id: 'calcul' as Tab, label: 'Calcul contribution', icon: Calculator },
  { id: 'deductions' as Tab, label: 'Déductions', icon: Receipt },
  { id: 'dsn' as Tab, label: 'Déclaration DSN', icon: FileText },
]

// ─── Composants utilitaires ───────────────────────────────────────────────────

function Note({ children, variant = 'info' }: {
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'success'
}) {
  const styles = {
    info: 'bg-[#EBF2FA] border-[#1E4A8C]/20 text-[#1E4A8C]',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }
  const IconComp = variant === 'warning' ? AlertTriangle : variant === 'success' ? CheckCircle : Info
  return (
    <div className={`flex gap-2.5 p-3.5 rounded-xl border text-sm ${styles[variant]}`}>
      <IconComp className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-[#1E4A8C]" />
        {title}
      </h3>
      <div className="pl-6 space-y-3">{children}</div>
    </div>
  )
}

function Table({ headers, rows }: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-[#1A1A2E] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[#374151] border-b border-[#E2E8F0] last:border-0 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Formula({ lines }: { lines: string[] }) {
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 font-mono text-sm space-y-1">
      {lines.map((l, i) => (
        <p key={i} className={l.startsWith('=') || l.startsWith('C') ? 'text-[#1E4A8C] font-semibold' : 'text-[#374151]'}>{l}</p>
      ))}
    </div>
  )
}

function ExampleBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#EBF2FA] rounded-xl p-4 text-sm space-y-2 border border-[#1E4A8C]/10">
      <p className="font-semibold text-[#1E4A8C]">{title}</p>
      <div className="space-y-1 text-[#374151]">{children}</div>
    </div>
  )
}

// ─── Onglet 1 : L'essentiel ───────────────────────────────────────────────────

function TabEssentiel() {
  return (
    <div className="space-y-8">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { Icon: Building2, value: '20 salariés', label: "Seuil d'assujettissement" },
          { Icon: Users,     value: '6 %',         label: "Taux d'obligation légale" },
          { Icon: Euro,      value: '11,88 €',      label: 'SMIC horaire brut 2025' },
          { Icon: Calendar,  value: '5 ou 15 mai',  label: 'Paiement contribution' },
        ] as const).map(({ Icon, value, label }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
            <div className="flex justify-center text-[#1E4A8C] mb-2"><Icon className="w-5 h-5" /></div>
            <p className="text-lg font-bold text-[#1A1A2E]">{value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <Note variant="info">
        Depuis le <strong>1er janvier 2020</strong>, la DOETH est intégrée dans la <strong>DSN</strong> et gérée par l&apos;<strong>Urssaf</strong>. L&apos;Agefiph n&apos;est plus l&apos;interlocuteur pour les déclarations et contributions post-2019.
      </Note>

      <Section title="Qui est concerné ?">
        <p className="text-sm text-[#374151]">Toutes les entreprises (privées et EPIC) employant <strong>20 salariés et plus</strong> sont assujetties à l&apos;OETH. L&apos;assujettissement est apprécié au niveau de <strong>l&apos;entreprise entière</strong>, pas par établissement.</p>
        <Note variant="warning">
          <strong>Période de neutralisation :</strong> Une entreprise qui franchit le seuil de 20 salariés bénéficie d&apos;un délai de <strong>5 ans</strong> avant d&apos;être soumise à la contribution. Elle doit néanmoins déclarer ses BOETH chaque mois en DSN.
        </Note>
        <Table
          headers={['Situation', 'Obligation déclarative', 'Contribution']}
          rows={[
            ['Moins de 20 salariés', 'DSN mensuelle BOETH', 'Non'],
            ['20 salariés et plus', 'DSN mensuelle + déclaration annuelle', 'Oui si taux < 6 %'],
            ["ETT / Groupements d'employeurs", 'Sur effectifs permanents uniquement', 'Sur effectifs permanents'],
          ]}
        />
      </Section>

      <Section title="Qu'est-ce qu'un BOETH ?">
        <p className="text-sm text-[#374151]">Les <strong>BOETH</strong> (Bénéficiaires de l&apos;Obligation d&apos;Emploi des Travailleurs Handicapés) sont les salariés reconnus handicapés par l&apos;une des voies officielles suivantes :</p>
        <Table
          headers={['Code DSN', 'Reconnaissance', 'Organisme délivrant']}
          rows={[
            ['01', 'Travailleur reconnu handicapé (RQTH)', 'CDAPH / MDPH'],
            ['02', 'Victime AT/MP : incapacité permanente ≥ 10 % + rente', 'CPAM / MSA'],
            ['03', "Pension d'invalidité réduisant ≥ 2/3 la capacité de travail", 'CPAM / MSA'],
            ['06', "Allocation ou rente d'invalidité (Loi du 31/12/1991)", 'Organisme verseur'],
            ['07', 'Carte mobilité inclusion mention « invalidité »', 'MDPH'],
            ['08', "Allocation aux Adultes Handicapés (AAH)", 'CAF / MSA'],
            ['12', "Ayant droit PCH / ACTP / AEEH, stagiaires uniquement", 'MDPH / CAF'],
          ]}
        />
        <Note variant="info">
          Un BOETH ne peut être comptabilisé <strong>qu&apos;une seule fois</strong> même s&apos;il relève de plusieurs catégories. Le salarié choisit librement de communiquer ou non son statut à l&apos;employeur.
        </Note>
      </Section>

      <Section title="Valorisation spéciale : BOETH de 50 ans et plus">
        <p className="text-sm text-[#374151]">Pour inciter au recrutement et maintien en emploi des seniors handicapés, l&apos;effectif moyen annuel des BOETH de <strong>50 ans et plus</strong> est <strong>multiplié par 1,5</strong> dans le calcul. Ce calcul est effectué automatiquement par l&apos;Urssaf.</p>
      </Section>

      <Section title="Calendrier clé">
        <Table
          headers={['Période', 'Action', 'Qui ?']}
          rows={[
            ['Chaque mois (DSN)', 'Déclarer le statut BOETH dans le bloc contrat S21.G00.40', 'Tous les employeurs'],
            ['Avant le 31 janvier', 'Recevoir les attestations des EA, ESAT, TIH, ETT (déductions)', 'Entreprises clientes'],
            ['Avant le 15 mars', "L'Urssaf notifie les effectifs BOETH et l'effectif d'assujettissement", 'Urssaf → entreprise'],
            ["DSN d'avril", 'Déclarer la contribution annuelle (pour exercice N-1)', 'Entreprises ≥ 20 sal.'],
            ['5 ou 15 mai', "Paiement de la contribution OETH auprès de l'Urssaf", 'Entreprises ≥ 20 sal.'],
            ['3ème semaine novembre (SEEPH)', "Semaine Européenne pour l'Emploi des Personnes Handicapées", 'Tous'],
            ['3 décembre', 'Journée mondiale du handicap', 'Tous'],
          ]}
        />
      </Section>

    </div>
  )
}

// ─── Onglet 2 : Calcul ────────────────────────────────────────────────────────

function TabCalcul() {
  return (
    <div className="space-y-8">

      <Note variant="info">
        <strong>Simulateur officiel :</strong> L&apos;Agefiph met à disposition un simulateur gratuit sur <strong>agefiph.fr/employeur/simulateur_doeth</strong> pour vérifier vos calculs avant déclaration.
      </Note>

      <Section title="Étape 1, Contribution brute avant déductions">
        <p className="text-sm text-[#374151]">La contribution brute est calculée selon la formule suivante :</p>
        <Formula lines={[
          'Contribution brute = BOETH manquants × Coefficient × SMIC horaire brut',
          '',
          "BOETH manquants = Obligation d'emploi − BOETH effectivement employés",
          "Obligation d'emploi = EMA × 6 % (arrondi à l'entier inférieur)",
        ]} />
        <Table
          headers={["Taille de l'entreprise (EMA)", 'Coefficient multiplicateur']}
          rows={[
            ['20 à 249 salariés', '400 × SMIC horaire brut'],
            ['250 à 749 salariés', '500 × SMIC horaire brut'],
            ['750 salariés et plus', '600 × SMIC horaire brut'],
          ]}
        />
        <Note variant="warning">
          Le SMIC à retenir est celui en vigueur au <strong>31 décembre</strong> de l&apos;année de référence. Pour 2025 : <strong>11,88 €/h</strong> en métropole et DOM (8,98 € à Mayotte).
        </Note>
        <ExampleBox title="Exemple, Entreprise de 55 salariés (exercice 2025)">
          <p>• EMA : 55 salariés → coefficient <strong>400</strong></p>
          <p>• Obligation : 55 × 6 % = 3,30 → arrondi à <strong>3 BOETH</strong></p>
          <p>• BOETH employés : <strong>1,38 UB</strong></p>
          <p>• BOETH manquants : 3 − 1,38 = <strong>1,62</strong></p>
          <p>• Contribution brute : 1,62 × 400 × 11,88 = <strong>7 698,24 €</strong></p>
        </ExampleBox>
      </Section>

      <Section title="Sur-contribution : coefficient 1 500 (3 années sans BOETH)">
        <p className="text-sm text-[#374151]">Le coefficient passe à <strong>1 500 fois le SMIC</strong> (quel que soit l&apos;effectif) si l&apos;entreprise n&apos;a, sur <strong>4 années consécutives</strong>, cumulativement :</p>
        <div className="space-y-2">
          {[
            'Employé aucun BOETH (interne ou externe)',
            "Passé aucun contrat de sous-traitance avec EA/ESAT/TIH/EPS dépassant 600 × SMIC sur 4 ans",
            "Appliqué aucun accord agréé",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm text-[#374151] bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Note variant="success">
          Pour éviter la sur-contribution, il suffit de satisfaire <strong>au moins une</strong> des 3 conditions ci-dessus sur la période de 4 ans.
        </Note>
      </Section>

      <Section title="Étape 2, Contribution nette (après déductions)">
        <Formula lines={[
          'Contribution nette = Contribution brute − Déductions totales',
          '',
          'Déductions possibles :',
          '  - Déduction ECAP (emplois aptitudes particulières)',
          '  - Déduction sous-traitance EA/ESAT/TIH/EPS',
          '  - Dépenses déductibles (accessibilité, maintien emploi, sensibilisation)',
        ]} />
        <p className="text-sm text-[#374151]">Voir l&apos;onglet <strong>Déductions</strong> pour le détail complet.</p>
      </Section>

      <Section title="Étape 3, Contribution réelle due">
        <p className="text-sm text-[#374151]">Depuis le <strong>1er janvier 2025</strong>, le mécanisme d&apos;écrêtement transitoire (2020–2024) n&apos;est plus applicable. La contribution réelle due est égale à la contribution nette.</p>
        <Note variant="info">
          L&apos;écrêtement peut encore s&apos;appliquer uniquement pour des <strong>régularisations portant sur des exercices antérieurs à 2025</strong>.
        </Note>
      </Section>

      <Section title="Taxation forfaitaire majorée (non-déclarants)">
        <p className="text-sm text-[#374151]">Depuis décembre 2024 (applicable sur les exercices 2023 et suivants), l&apos;Urssaf applique d&apos;office une <strong>contribution forfaitaire majorée de 25 %</strong> aux entreprises qui n&apos;ont pas déposé leur DOETH. Ce taux augmente de <strong>5 points par année d&apos;absence déclarative consécutive</strong>.</p>
        <Formula lines={[
          "Taxation forfaitaire = (BOETH manquants × SMIC × Coefficient) × (1 + 25 %)",
          "  + majoration de 5 points par année supplémentaire non déclarée",
        ]} />
      </Section>

    </div>
  )
}

// ─── Onglet 3 : Déductions ────────────────────────────────────────────────────

function TabDeductions() {
  return (
    <div className="space-y-8">

      <p className="text-sm text-[#374151]">Les déductions viennent <strong>minorer la contribution brute</strong>. Vous déclarez les montants bruts non plafonnés, l&apos;Urssaf applique les plafonds lors du calcul de la contribution nette.</p>

      <Section title="1. Déduction sous-traitance, EA, ESAT, TIH, EPS">
        <p className="text-sm text-[#374151]">Les achats passés avec des <strong>Entreprises Adaptées (EA)</strong>, <strong>ESAT</strong>, <strong>Travailleurs Indépendants Handicapés (TIH)</strong> ou <strong>entreprises de portage salarial (EPS)</strong> dont le salarié porté est BOETH ouvrent droit à déduction.</p>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-[#1A1A2E]">Calcul de la déduction (fournie par l&apos;attestation annuelle)</p>
          <Formula lines={[
            "Déduction = 30 % × (Prix HT − Coûts matières / sous-traitance / frais de vente)",
          ]} />
          <p className="text-[#6B7280] text-xs mt-2">Ce montant vous est communiqué par l&apos;attestation annuelle transmise par l&apos;EA/ESAT/TIH avant le <strong>31 janvier</strong> de l&apos;année N.</p>
        </div>
        <Table
          headers={["Taux BOETH de l'entreprise", 'Plafond de la déduction sous-traitance']}
          rows={[
            ['Moins de 3 % de BOETH', '50 % de la contribution brute avant déductions'],
            ['3 % ou plus de BOETH', '75 % de la contribution brute avant déductions'],
          ]}
        />
        <Note variant="warning">
          Conservez les attestations annuelles, vous n&apos;avez pas à les envoyer à l&apos;Urssaf, mais elles peuvent être demandées lors d&apos;un contrôle.
        </Note>
      </Section>

      <Section title="2. Déduction ECAP (Emplois à Conditions d'Aptitudes Particulières)">
        <p className="text-sm text-[#374151]">Certains emplois (pompiers, conducteurs routiers, pilotes, dockers…) dispensent l&apos;employeur de les proposer à des travailleurs handicapés. La liste est fixée par décret.</p>
        <Formula lines={[
          "Déduction ECAP = EMA ECAP × 17 × SMIC horaire brut",
          "",
          "EMA ECAP est calculé et communiqué par l'Urssaf avant le 31 janvier.",
        ]} />
        <Note variant="success">
          La déduction ECAP est <strong>non plafonnée</strong>, elle peut annuler entièrement la contribution annuelle.
        </Note>
      </Section>

      <Section title="3. Dépenses déductibles (plafonnées à 10 %)">
        <p className="text-sm text-[#374151]">Certaines dépenses directes en faveur des travailleurs handicapés sont déductibles, dans la limite de <strong>10 % du montant de la contribution brute</strong>. Montants à déclarer hors taxes.</p>
        <Table
          headers={['Type de dépense', 'Exemples', 'Code DSN']}
          rows={[
            [
              "Travaux d'accessibilité",
              "Aménagement parking, ascenseur, rampes d'accès, au-delà de l'obligation légale",
              '062',
            ],
            [
              'Maintien / reconversion professionnelle',
              "Matériel ergonomique, prothèse auditive, logiciel adapté, aménagement de poste (part non prise en charge par Agefiph/CPAM)",
              '063',
            ],
            [
              'Accompagnement & sensibilisation',
              "Job coaching, formation des managers au handicap, actions réalisées par un organisme externe",
              '064',
            ],
            [
              "Partenariats associatifs (jusqu'au 31/12/2029)",
              "Convention ou adhésion avec association d'insertion de personnes handicapées, si CDI, CDD ≥ 6 mois, alternance ou stage ≥ 6 mois avec un BOETH",
              '072',
            ],
          ]}
        />
        <Note variant="warning">
          <strong>Supprimées depuis l&apos;exercice 2025 :</strong> les déductions liées à la participation à des événements et aux achats mixtes auprès d&apos;EA/ESAT/TIH ne sont plus déductibles pour les périodes d&apos;emploi postérieures à 2024.
        </Note>
        <Note variant="info">
          Seule la part <strong>restant à la charge de l&apos;employeur</strong> est déductible (après déduction des aides Agefiph, CPAM, MDPH…). Une aide Agefiph et une déduction OETH ne peuvent pas se cumuler pour la même dépense.
        </Note>
      </Section>

      <Section title="Récapitulatif des plafonds">
        <Table
          headers={['Déduction', 'Plafond', 'Code DSN']}
          rows={[
            ['ECAP', 'Non plafonné', '060'],
            ['Sous-traitance (taux BOETH < 3 %)', '50 % de la contribution brute', '061'],
            ['Sous-traitance (taux BOETH ≥ 3 %)', '75 % de la contribution brute', '061'],
            ['Dépenses déductibles (accessibilité, maintien, sensibilisation, partenariats)', '10 % de la contribution brute', '062–064, 072'],
          ]}
        />
      </Section>

    </div>
  )
}

// ─── Onglet 4 : Déclaration DSN ───────────────────────────────────────────────

function TabDSN() {
  return (
    <div className="space-y-8">

      <Section title="Déclaration mensuelle, Tous les mois">
        <p className="text-sm text-[#374151]">Depuis janvier 2020, <strong>tout employeur</strong> (quelle que soit sa taille) doit déclarer dans la DSN mensuelle le statut BOETH de chaque salarié concerné.</p>
        <Table
          headers={['Bloc DSN', 'Rubrique', 'Contenu']}
          rows={[
            ['S21.G00.40, Contrat', 'S21.G00.40.072, Statut BOETH', "Code statut BOETH du salarié (01 à 12). Laisser vide si non-BOETH."],
            ['S21.G00.40, Contrat', "S21.G00.40.007, Nature du contrat", "Valeur « 29 » pour les stagiaires non rémunérés BOETH"],
            ['S21.G00.41, Changement contrat', 'S21.G00.41.048, Ancien statut BOETH', 'Pour corriger rétroactivement un statut BOETH'],
          ]}
        />
        <Note variant="info">
          En cas de reconnaissance en cours d&apos;année, une régularisation rétroactive est possible via un bloc « Changement Contrat » avec la date d&apos;effet et une profondeur de recalcul au 1er jour du mois concerné.
        </Note>
      </Section>

      <Section title="Déclaration annuelle, DSN d'avril (paiement mai)">
        <p className="text-sm text-[#374151]">Les entreprises de <strong>20 salariés et plus</strong> déclarent leur contribution dans la <strong>DSN d&apos;avril</strong>, exigible le <strong>5 ou 15 mai</strong> selon l&apos;effectif.</p>
        <Table
          headers={['Code cotisation', 'Libellé', 'Montant à déclarer']}
          rows={[
            ['065', 'Contribution OETH brute avant déductions', 'Montant brut calculé'],
            ['060', 'Déduction ECAP', 'EMA ECAP × 17 × SMIC (non plafonné)'],
            ['061', 'Déduction sous-traitance (EA, ESAT, TIH, EPS)', "Montant de l'attestation, non plafonné"],
            ['062', "Dépense déductible, travaux d'accessibilité", 'Montant HT factures, non plafonné'],
            ['063', 'Dépense déductible, maintien/reconversion', 'Montant HT factures, non plafonné'],
            ['064', 'Dépense déductible, accompagnement/sensibilisation', 'Montant HT factures, non plafonné'],
            ['072', 'Dépense déductible, partenariats associations', 'Montant HT (plafond 10 % appliqué par Urssaf)'],
            ['066', 'Contribution OETH nette', 'Après déductions'],
            ['068', 'Contribution OETH réelle due', 'Montant final à payer (0 € si accord agréé)'],
          ]}
        />
        <Note variant="warning">
          Les plafonds des déductions <strong>ne sont pas à appliquer par l&apos;employeur</strong> lors de la saisie, vous déclarez les montants bruts non plafonnés. L&apos;Urssaf applique les plafonds lors du calcul de la contribution nette (code 066).
        </Note>
      </Section>

      <Section title="Accord agréé, Alternative à la contribution">
        <p className="text-sm text-[#374151]">Une entreprise peut s&apos;exonérer de contribution en concluant un <strong>accord agréé de branche, de groupe ou d&apos;entreprise</strong> prévoyant un programme pluriannuel en faveur des travailleurs handicapés.</p>
        <Table
          headers={['Caractéristique', 'Détail']}
          rows={[
            ['Durée', '3 ans maximum, renouvelable une fois'],
            ['Budget minimum', 'Équivalent de la contribution qui aurait été due'],
            ['Procédure', "Dépôt via l'applicatif AGAPE'TH (dématérialisé)"],
            ['Déclaration DSN', 'Déclarer une contribution réelle due (code 068) à 0 €'],
            ["Accord de branche", "Verser le budget aux structures porteuses (HandiEM, Asso OETH…), pas à l'Urssaf"],
          ]}
        />
        <Note variant="info">
          Les entreprises sous accord agréé ne déclarent <strong>pas</strong> les dépenses déductibles (codes 062–064, 072), uniquement ECAP (060) et sous-traitance (061).
        </Note>
      </Section>

      <Section title="Alerte fraudes">
        <Note variant="warning">
          <strong>Attention aux démarches frauduleuses !</strong> Des sociétés se présentent parfois comme mandatées par l&apos;Urssaf. <strong>Aucune société privée n&apos;est habilitée</strong> à réclamer vos effectifs BOETH. En cas de doute, contactez directement votre Urssaf ou la DGCCRF.
        </Note>
      </Section>

    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function GuideOETH() {
  const [activeTab, setActiveTab] = useState<Tab>('essentiel')

  return (
    <div>
      <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-[#1E4A8C] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'essentiel'  && <TabEssentiel />}
        {activeTab === 'calcul'     && <TabCalcul />}
        {activeTab === 'deductions' && <TabDeductions />}
        {activeTab === 'dsn'        && <TabDSN />}
      </div>

      <div className="mt-10 pt-6 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#9CA3AF]">
          Sources : Guide de l&apos;OETH v2.5, Urssaf / Agefiph (7 avril 2026) · Décret n° 2019-522 &amp; 523 · Décret n° 2025-1294 · Loi n° 2018-771 du 5 sept. 2018
        </p>
      </div>
    </div>
  )
}
