'use client'

import { joursRestants } from '@/lib/utils'
import type { RQTHEmployee, Establishment } from '@/types'
import { Users, AlertTriangle, Clock, CheckCircle, Building2, FileText } from 'lucide-react'
import { LABEL_TYPE_CONTRAT } from '@/types'

interface Props {
  salaries: RQTHEmployee[]
  establishments: Establishment[]
}

function getUrgence(jours: number): {
  label: string
  barColor: string
  badgeColor: string
  icon: React.ReactNode
} {
  if (jours < 0) return {
    label: 'Expirée',
    barColor: 'bg-[#9CA3AF]',
    badgeColor: 'bg-gray-100 text-gray-500 border border-gray-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  }
  if (jours <= 30) return {
    label: `${jours} jour${jours > 1 ? 's' : ''}`,
    barColor: 'bg-red-500',
    badgeColor: 'bg-red-50 text-red-700 border border-red-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  }
  if (jours <= 90) return {
    label: `${jours} jours`,
    barColor: 'bg-orange-400',
    badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  }
  return {
    label: `${jours} jours`,
    barColor: 'bg-[#1E4A8C]',
    badgeColor: 'bg-[#EBF2FA] text-[#1E4A8C] border border-[#1E4A8C]/20',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  }
}

export function SuiviRQTH({ salaries, establishments }: Props) {
  const etablissementMap = Object.fromEntries(establishments.map((e) => [e.id, e.name]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Salariés présents uniquement (non archivés)
  const presents = salaries.filter(s => !s.date_sortie_entreprise || new Date(s.date_sortie_entreprise) >= today)

  // RQTH temporaires
  const avecDateFin = presents
    .filter((s) => !s.est_permanent && s.date_fin != null)
    .sort((a, b) => new Date(a.date_fin!).getTime() - new Date(b.date_fin!).getTime())

  // Fins de contrat (CDD, stage, alternance, etc.)
  const avecFinContrat = presents
    .filter(s => s.date_fin_contrat != null)
    .sort((a, b) => new Date(a.date_fin_contrat!).getTime() - new Date(b.date_fin_contrat!).getTime())

  if (avecDateFin.length === 0 && avecFinContrat.length === 0) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun salarié avec une RQTH ou un contrat a echeance</p>
        <p className="text-sm mt-1">Les reconnaissances temporaires et fins de contrat apparaissent ici.</p>
      </div>
    )
  }

  // Séparer en groupes d'urgence
  const expires = avecDateFin.filter((s) => joursRestants(s.date_fin!) < 0)
  const urgents = avecDateFin.filter((s) => { const j = joursRestants(s.date_fin!); return j >= 0 && j <= 30 })
  const proches = avecDateFin.filter((s) => { const j = joursRestants(s.date_fin!); return j > 30 && j <= 90 })
  const ok = avecDateFin.filter((s) => joursRestants(s.date_fin!) > 90)

  const groupes = [
    { titre: 'Expirées', items: expires, accent: 'text-gray-500' },
    { titre: 'À renouveler, moins de 30 jours', items: urgents, accent: 'text-red-600' },
    { titre: 'À anticiper, moins de 3 mois', items: proches, accent: 'text-orange-600' },
    { titre: 'Valides', items: ok, accent: 'text-[#1E4A8C]' },
  ].filter((g) => g.items.length > 0)

  // Groupes fins de contrat
  const finContratsExpires   = avecFinContrat.filter(s => joursRestants(s.date_fin_contrat!) < 0)
  const finContratsUrgents   = avecFinContrat.filter(s => { const j = joursRestants(s.date_fin_contrat!); return j >= 0 && j <= 30 })
  const finContratsProches   = avecFinContrat.filter(s => { const j = joursRestants(s.date_fin_contrat!); return j > 30 && j <= 90 })
  const finContratsOk        = avecFinContrat.filter(s => joursRestants(s.date_fin_contrat!) > 90)

  const groupesContrats = [
    { titre: 'Contrat termine - a archiver', items: finContratsExpires, accent: 'text-red-600' },
    { titre: 'Fin de contrat, moins de 30 jours', items: finContratsUrgents, accent: 'text-orange-600' },
    { titre: 'Fin de contrat, moins de 3 mois', items: finContratsProches, accent: 'text-amber-600' },
    { titre: 'Contrats en cours', items: finContratsOk, accent: 'text-[#6B7280]' },
  ].filter(g => g.items.length > 0)

  return (
    <div className="space-y-8">

      {/* ── Section fins de contrat ── */}
      {groupesContrats.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-[13px] font-bold text-[#1A1A2E] uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6B7280]" />
            Fins de contrat
          </h2>
          {groupesContrats.map((groupe) => (
            <div key={groupe.titre}>
              <h3 className={`text-[15px] font-semibold mb-3 flex items-center gap-2 ${groupe.accent}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {groupe.titre}
                <span className="ml-auto text-xs font-medium bg-white border border-[#E2E8F0] text-[#6B7280] rounded-full px-2 py-0.5">
                  {groupe.items.length}
                </span>
              </h3>
              <div className="space-y-3">
                {groupe.items.map((s) => {
                  const jours = joursRestants(s.date_fin_contrat!)
                  const urgence = getUrgence(jours)
                  const nomComplet = [s.prenom, s.nom].filter(Boolean).join(' ') || '-'
                  const etablissementNom = s.establishment_id ? etablissementMap[s.establishment_id] : null
                  return (
                    <div key={s.id} className="flex gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#2E75B6]/30 transition-colors">
                      <div className="shrink-0 flex flex-col items-center gap-1 w-1">
                        <div className={`w-1 rounded-full flex-1 min-h-[40px] ${urgence.barColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A2E]">{nomComplet}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {s.matricule && <span className="text-xs text-[#6B7280]">Matricule {s.matricule}</span>}
                          <span className="text-xs font-medium text-[#6B7280]">
                            {LABEL_TYPE_CONTRAT[s.type_contrat ?? 'cdi']}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${urgence.badgeColor}`}>
                            {urgence.icon}
                            {jours < 0 ? 'Contrat termine' : `Fin dans ${urgence.label}`}
                          </span>
                          {etablissementNom && (
                            <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-full px-2 py-0.5 font-medium">
                              <Building2 className="w-3 h-3" />
                              {etablissementNom}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">Fin contrat</p>
                        <p className="text-sm font-semibold text-[#1A1A2E]">
                          {new Date(s.date_fin_contrat! + 'T00:00:00').toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section validite des reconnaissances RQTH ── */}
      {avecDateFin.length > 0 && (
        <div className={groupesContrats.length > 0 ? 'pt-4 border-t border-[#E2E8F0]' : ''}>
          {groupesContrats.length > 0 && (
            <h2 className="text-[13px] font-bold text-[#1A1A2E] uppercase tracking-wide flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-[#6B7280]" />
              Validite des reconnaissances RQTH
            </h2>
          )}
          <div className="space-y-8">
            {groupes.map((groupe) => (
              <div key={groupe.titre}>
                <h2 className={`text-[15px] font-semibold mb-3 flex items-center gap-2 ${groupe.accent}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {groupe.titre}
                  <span className="ml-auto text-xs font-medium bg-white border border-[#E2E8F0] text-[#6B7280] rounded-full px-2 py-0.5">
                    {groupe.items.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {groupe.items.map((s) => {
                    const jours = joursRestants(s.date_fin!)
                    const urgence = getUrgence(jours)
                    const nomComplet = [s.prenom, s.nom].filter(Boolean).join(' ') || '-'
                    const etablissementNom = s.establishment_id ? etablissementMap[s.establishment_id] : null
                    return (
                      <div
                        key={s.id}
                        className="flex gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#2E75B6]/30 transition-colors"
                      >
                        <div className="shrink-0 flex flex-col items-center gap-1 w-1">
                          <div className={`w-1 rounded-full flex-1 min-h-[40px] ${urgence.barColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A2E]">{nomComplet}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {s.matricule && (
                              <span className="text-xs text-[#6B7280]">Matricule {s.matricule}</span>
                            )}
                            {s.service && (
                              <span className="text-xs text-[#6B7280]">· {s.service}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${urgence.badgeColor}`}>
                              {urgence.icon}
                              {jours < 0 ? 'Expiree' : `Expire dans ${urgence.label}`}
                            </span>
                            {etablissementNom && (
                              <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-full px-2 py-0.5 font-medium">
                                <Building2 className="w-3 h-3" />
                                {etablissementNom}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">Expiration</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">
                            {new Date(s.date_fin! + 'T00:00:00').toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
