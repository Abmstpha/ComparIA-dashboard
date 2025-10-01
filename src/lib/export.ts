import type { LongRow } from '../types'
import { exportToCSV } from './csv'

export function exportLongDataAsCSV(longData: LongRow[], filename: string = 'data.csv'): void {
  const csvData = longData.map(row => ({
    model: row.model,
    prompt: row.prompt,
    metric: row.metric,
    value: row.value,
  }))

  exportToCSV(csvData, filename)
}

export function exportChartAsPNG(chartId: string, filename: string = 'chart.png'): void {
  const chartElement = document.getElementById(chartId)
  
  if (!chartElement) {
    console.error(`Chart element with id "${chartId}" not found`)
    return
  }

  // For ECharts, we need to get the canvas element
  const canvas = chartElement.querySelector('canvas')
  
  if (!canvas) {
    console.error('Canvas element not found in chart')
    return
  }

  try {
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas')
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('Failed to export chart as PNG:', error)
  }
}

export function exportTableAsCSV(
  data: Record<string, unknown>[],
  filename: string = 'table.csv'
): void {
  exportToCSV(data, filename)
}

export function downloadSampleCSV(): void {
  const sampleData = [
    {
      metric: 'gpt4o_quality',
      p01: 4.5,
      p02: 4.2,
      p03: 4.8,
      p04: 4.1,
      p05: 4.6,
    },
    {
      metric: 'gpt4o_latency_s',
      p01: 0.95,
      p02: 1.10,
      p03: 1.20,
      p04: 0.85,
      p05: 1.05,
    },
    {
      metric: 'gpt4o_energy_wh',
      p01: 0.0061,
      p02: 0.0068,
      p03: 0.0070,
      p04: 0.0055,
      p05: 0.0063,
    },
    {
      metric: 'mistral7b_quality',
      p01: 3.8,
      p02: 3.5,
      p03: 4.0,
      p04: 3.2,
      p05: 3.9,
    },
    {
      metric: 'mistral7b_latency_s',
      p01: 0.45,
      p02: 0.52,
      p03: 0.48,
      p04: 0.41,
      p05: 0.50,
    },
    {
      metric: 'mistral7b_energy_wh',
      p01: 0.0032,
      p02: 0.0038,
      p03: 0.0035,
      p04: 0.0029,
      p05: 0.0036,
    },
  ]

  exportToCSV(sampleData, 'sample_benchmark.csv')
}
