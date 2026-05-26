'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

export interface MoisProjection {
  mois: string
  taux: number
  type: 'passe' | 'actuel' | 'projection'
}

interface CarteProjectionProps {
  data: MoisProjection[]
  ubManquantes: number
}

export function CarteProjection({ data, ubManquantes }: CarteProjectionProps) {
  const derniere = data[data.length - 1]
  const tauxFin = derniere?.taux ?? 0
  const conforme = tauxFin >= 6

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-[#6B7280]">Taux projeté fin d&apos;année</p>
          <p className={`text-xl font-bold ${conforme ? 'text-[#2E7D32]' : 'text-[#BF5A00]'}`}>
            {tauxFin.toFixed(2)}%
          </p>
        </div>
        {ubManquantes > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-[#6B7280]">UB à combler d&apos;ici déc.</p>
            <p className="text-xl font-bold text-[#B71C1C]">{ubManquantes.toFixed(2)} UB</p>
          </div>
        )}
        {ubManquantes === 0 && (
          <div className="ml-auto">
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
              Objectif 6% atteint
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={160} minWidth={0}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            domain={[0, Math.max(7, Math.ceil((tauxFin + 1)))]}
          />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Taux OETH']}
            contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
          />
          <ReferenceLine
            y={6}
            stroke="#2E7D32"
            strokeDasharray="4 4"
            label={{ value: '6%', position: 'insideTopRight', fontSize: 10, fill: '#2E7D32' }}
          />
          <Bar dataKey="taux" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.type === 'projection'
                    ? entry.taux >= 6 ? '#4ADE80' : '#93C5FD'
                    : '#1E4A8C'
                }
                opacity={entry.type === 'passe' ? 0.45 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-[10px] text-[#6B7280]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1E4A8C] opacity-45 inline-block" />Données réelles</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#93C5FD] inline-block" />Projection (reconnaissances actives)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#4ADE80] inline-block" />Objectif atteint</span>
      </div>
    </div>
  )
}
