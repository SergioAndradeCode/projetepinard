export function MockupDashboard() {
  const barData = [4.1, 4.4, 4.9, 5.5, 6.2, 6.8, 7.1, 7.2, null, null, null, null]
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

  return (
    <div className="relative w-full">
      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        {/* Title bar */}
        <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-[11px] text-white/50 text-center">
            app.talenth.fr/dashboard
          </div>
        </div>

        {/* App shell */}
        <div className="flex bg-[#F8FAFC]" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-12 bg-[#0D1F3C] flex flex-col items-center py-4 gap-4 shrink-0">
            {[
              <svg key="home" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1.5L1 7h2v7h4v-4h2v4h4V7h2L8 1.5z"/></svg>,
              <svg key="users" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5 7a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM1 13c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4H1z"/></svg>,
              <svg key="building" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2 2h12v12H9V9H7v5H2V2zm2 2v2h2V4H4zm4 0v2h2V4H8zm-4 4v2h2V8H4zm4 0v2h2V8H8z"/></svg>,
              <svg key="chart" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M1 13V7h3v6H1zm4 0V4h3v9H5zm4 0V9h3v4H9z"/></svg>,
              <svg key="euro" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zM5 8h1.5a1.5 1.5 0 003 0H11v1H9.5a2.5 2.5 0 01-5 0H3V8h2zm1.5-1a2.5 2.5 0 014.95 0H9.5a1.5 1.5 0 00-3 0H5V7H3v-.05L5 7h1.5z"/></svg>,
              <svg key="calendar" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5 1v1H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-2V1h-1v1H6V1H5zm-2 4h10v7H3V5z"/></svg>,
            ].map((icon, i) => (
              <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[#1E4A8C] text-white' : 'text-white/40'}`}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* Status banner */}
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-[11px] font-semibold text-green-800">Taux OETH conforme, objectif 6% atteint</span>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ 2025</span>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Taux OETH', value: '7,2%', sub: 'Objectif 6% ✓', color: 'text-[#2E7D32]' },
                { label: 'BOETH actifs', value: '14', sub: '16,8 UB · 2 seniors ×1,5', color: 'text-[#1A1A2E]' },
                { label: 'Contribution', value: '0 €', sub: 'Aucune due', color: 'text-[#2E7D32]' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-white rounded-xl p-2.5 shadow-sm border border-[#E2E8F0]">
                  <p className="text-[10px] text-[#6B7280]">{label}</p>
                  <p className={`text-lg font-bold ${color} leading-tight mt-0.5`}>{value}</p>
                  <p className={`text-[9px] mt-0.5 ${color === 'text-[#2E7D32]' ? 'text-green-600' : 'text-[#6B7280]'}`}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Chart */}
              <div className="col-span-2 bg-white rounded-xl p-2.5 shadow-sm border border-[#E2E8F0]">
                <p className="text-[10px] font-semibold text-[#6B7280] mb-2">Projection fin d&apos;année</p>
                <div className="flex items-end gap-0.5 h-14">
                  {barData.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: v ? `${(v / 8) * 100}%` : '38%',
                        backgroundColor: v
                          ? v >= 6 ? '#22c55e' : '#1E4A8C'
                          : '#93c5fd',
                        opacity: v ? (i < 8 ? 0.6 : 1) : 0.7,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {months.map((m, i) => (
                    <span key={i} className="text-[8px] text-[#9CA3AF] flex-1 text-center">{m}</span>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-[#E2E8F0] space-y-1.5">
                <p className="text-[10px] font-semibold text-[#6B7280]">Alertes</p>
                {[
                  { dot: 'bg-orange-400', text: 'Dupont M., exp. 15 jan.' },
                  { dot: 'bg-orange-400', text: 'Martin C., exp. 28 jan.' },
                  { dot: 'bg-green-400', text: 'Toutes en règle' },
                ].map(({ dot, text }, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                    <span className="text-[9px] text-[#6B7280] truncate">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-[#E2E8F0] px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-sm">✓</div>
        <div>
          <p className="text-[10px] font-bold text-[#1A1A2E]">Conforme 2025</p>
          <p className="text-[9px] text-[#6B7280]">Taux 7,2% · Quota 6%</p>
        </div>
      </div>
    </div>
  )
}

export function MockupRQTH() {
  const employees = [
    { name: 'Sophie Dupont', type: 'RQTH', taux: '100%', ub: '1,50', status: 'orange', statusLabel: 'Exp. bientôt' },
    { name: 'Marc Bernard', type: 'AAH', taux: '80%', ub: '0,80', status: 'green', statusLabel: 'Actif' },
    { name: 'Julie Martin', type: 'RQTH', taux: '100%', ub: '1,50', status: 'green', statusLabel: 'Actif' },
    { name: 'Pierre Leroy', type: 'Pension inv. 2', taux: '60%', ub: '0,60', status: 'green', statusLabel: 'Actif' },
  ]
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#E2E8F0]">
      <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" /><div className="w-3 h-3 rounded-full bg-[#FFBD2E]" /><div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-[11px] text-white/50 text-center">app.talenth.fr/rqth</div>
      </div>
      <div className="bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E]">Salariés BOETH</p>
            <p className="text-xs text-[#6B7280]">14 actifs · 16,8 UB totales</p>
          </div>
          <div className="text-xs bg-[#1E4A8C] text-white px-3 py-1.5 rounded-lg font-medium">+ Ajouter</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {['Collaborateur', 'Type', 'Taux', 'UB', 'Statut'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-[#6B7280] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {employees.map(e => (
                <tr key={e.name} className="bg-white">
                  <td className="px-3 py-2 font-medium text-[#1A1A2E]">{e.name}</td>
                  <td className="px-3 py-2 text-[#6B7280]">{e.type}</td>
                  <td className="px-3 py-2 text-[#6B7280]">{e.taux}</td>
                  <td className="px-3 py-2 font-semibold text-[#1E4A8C]">{e.ub}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${e.status === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {e.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function MockupDOETH() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#E2E8F0]">
      <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" /><div className="w-3 h-3 rounded-full bg-[#FFBD2E]" /><div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-[11px] text-white/50 text-center">app.talenth.fr/doeth</div>
      </div>
      <div className="bg-[#F8FAFC] p-4 space-y-3">
        {/* Steps */}
        <div className="flex gap-1">
          {['Année', 'Établissements', 'UB', 'Contribution', 'Export DSN'].map((s, i) => (
            <div key={s} className={`flex-1 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium ${i < 3 ? 'bg-green-50 text-green-700 border border-green-200' : i === 3 ? 'bg-[#EBF2FA] border border-[#1E4A8C]/30 text-[#1E4A8C]' : 'bg-white border border-[#E2E8F0] text-[#6B7280]'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${i < 3 ? 'bg-green-500 text-white' : i === 3 ? 'bg-[#1E4A8C] text-white' : 'bg-[#E2E8F0] text-[#6B7280]'}`}>
                {i < 3 ? '✓' : i + 1}
              </div>
              <span className="truncate hidden sm:block">{s}</span>
            </div>
          ))}
        </div>
        {/* Contribution card */}
        <div className="bg-[#EBF2FA] border-2 border-[#1E4A8C]/30 rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Calcul de la contribution</p>
          {[
            ['Effectif assujettissement', '230 salariés'],
            ['Quota légal BOETH (6%)', '13,80 UB requises'],
            ['Total UB comptabilisées', '16,80 UB'],
            ['Déficit', '0 UB'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-[#6B7280]">{k}</span>
              <span className="font-semibold text-[#1A1A2E]">{v}</span>
            </div>
          ))}
          <div className="border-t border-[#1E4A8C]/20 pt-2 flex justify-between">
            <span className="text-[11px] font-bold text-[#1E4A8C]">CONTRIBUTION NETTE</span>
            <span className="text-base font-bold text-[#2E7D32]">0 €</span>
          </div>
        </div>
        <div className="bg-[#1E4A8C] text-white text-center text-[11px] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M8 11L4 7h2.5V2h3v5H12L8 11zM2 13h12v1.5H2V13z"/></svg>
          Exporter le dossier DOETH (.xlsx)
        </div>
      </div>
    </div>
  )
}
