import type React from 'react'
import { captureChart } from './chartCapture'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function triggerExport(params: {
  type: 'budget' | 'rqth' | 'esat' | 'doeth'
  data: unknown
  chartRefs?: React.RefObject<HTMLDivElement>[]
  filename?: string
}) {
  const { type, data, chartRefs = [], filename } = params

  const charts = await Promise.all(
    chartRefs.map(async (ref, i) => ({
      name: `chart_${i}`,
      png: await captureChart(ref),
    }))
  )

  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data, charts: charts.filter(c => c.png) }),
  })

  if (!res.ok) throw new Error("Erreur lors de la génération de l'export")

  const blob = await res.blob()
  const defaultFilename = `Talenth_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadBlob(blob, filename ?? defaultFilename)
}
