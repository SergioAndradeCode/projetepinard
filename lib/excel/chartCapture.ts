import type ExcelJS from 'exceljs'
import type React from 'react'

export async function captureChart(chartRef: React.RefObject<HTMLDivElement>): Promise<string | null> {
  if (!chartRef.current) return null
  try {
    const { toPng } = await import('html-to-image')
    return await toPng(chartRef.current, {
      backgroundColor: '#FFFFFF',
      pixelRatio: 2,
      quality: 1.0,
    })
  } catch {
    return null
  }
}

export function embedChartInSheet(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  pngDataUrl: string,
  position: { col: number; row: number; width: number; height: number }
) {
  const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, '')
  const imageId = workbook.addImage({ base64, extension: 'png' })
  worksheet.addImage(imageId, {
    tl: { col: position.col, row: position.row },
    ext: { width: position.width, height: position.height },
  })
}
