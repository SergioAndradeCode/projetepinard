'use client'

import { useState } from 'react'
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
  dataN1: MoisProjection[]
  dataN2: MoisProjection[]
  ubManquantes: number
  annee: number
}

export function CarteProjection({ data, dataN1, dataN2, ubManquantes, annee }: CarteProjectionProps) {
  const [decalage, setDecalage] = useState<0 | 1 | 2>(0)

  const jeux = [data, dataN1, dataN2]
  const activeData = jeux[decalage]
  const activeAnnee = annee + decalage

  const derniere = activeData[activeData.length - 1]
  const tauxFin = derniere?.taux ?? 0
  const conforme = tauxFin >= 6

  return (
    <div className="space-y-3">

      {/* Sélecteur d'année */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-[#F8FAFC] rounded-lg p-0.5 border border-[#E2E8F0]">
          {([0, 1, 2] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDecalage(d)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                decalage === d
                  ? 'bg-white text-[#1E4A8C] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {annee + d}
            </button>
          ))}
        </div>
        {decalage > 0 && (
          <span className="text-[10px] text-[#9CA3AF] italic">
            Projection sur reconnaissances actuelles
          </span>
        )}
      </div>

      {/* Indicateurs */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-[#6B7280]">Taux projete fin {activeAnnee}</p>
          <p className={`text-xl font-bold ${conforme ? 'text-[#2E7D32]' : 'text-[#BF5A00]'}`}>
            {tauxFin.toFixed(2)}%
          </p>
        </div>
        {decalage === 0 && ubManquantes > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-[#6B7280]">UB a combler d&apos;ici dec.</p>
            <p className="text-xl font-bold text-[#B71C1C]">{ubManquantes.toFixed(2)} UB</p>
          </div>
        )}
        {decalage === 0 && ubManquantes === 0 && (
          <div className="ml-auto">
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
              Objectif 6% atteint
            </span>
          </div>
        )}
        {decalage > 0 && conforme && (
          <div className="ml-auto">
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
              Objectif 6% maintenu
            </span>
          </div>
        )}
        {decalage > 0 && !conforme && (
          <div className="ml-auto text-right">
            <p className="text-xs text-[#6B7280]">Ecart objectif 6%</p>
            <p className="text-xl font-bold text-[#B71C1C]">
              {(6 - tauxFin).toFixed(2)} pts
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={160} minWidth={0}>
        <BarChart data={activeData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
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
            domain={[0, Math.max(7, Math.ceil(tauxFin + 1))]}
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
            {activeData.map((entry, i) => (
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
        {decalage === 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1E4A8C] opacity-45 inline-block" />
            Donnees reelles
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#93C5FD] inline-block" />
          Projection
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#4ADE80] inline-block" />
          Objectif atteint
        </span>
      </div>
    </div>
  )
}
