import Papa from 'papaparse'
import type { MatrixRow } from '../types'

export interface CsvParseResult {
  data: MatrixRow[]
  error: string | null
}

export function parseCSV(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            resolve({
              data: [],
              error: `CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`
            })
            return
          }

          const data = results.data as Record<string, unknown>[]
          
          if (data.length === 0) {
            resolve({
              data: [],
              error: 'CSV file is empty'
            })
            return
          }

          // Validate that first column is 'metric'
          const firstRow = data[0]
          if (!firstRow || !('metric' in firstRow)) {
            resolve({
              data: [],
              error: 'CSV must have "metric" as the first column header'
            })
            return
          }

          const matrixData: MatrixRow[] = data.map((row) => {
            const { metric, ...values } = row
            const metricLabel = String(metric || '').trim()
            
            if (!metricLabel) {
              throw new Error('Empty metric label found')
            }

            const processedValues: Record<string, number | null> = {}
            
            Object.entries(values).forEach(([key, value]) => {
              if (typeof value === 'number' && !isNaN(value)) {
                processedValues[key] = value
              } else if (typeof value === 'string' && value.trim() !== '') {
                const parsed = parseFloat(value.trim())
                processedValues[key] = isNaN(parsed) ? null : parsed
              } else {
                processedValues[key] = null
              }
            })

            return {
              metricLabel,
              values: processedValues
            }
          })

          resolve({
            data: matrixData,
            error: null
          })
        } catch (error) {
          resolve({
            data: [],
            error: error instanceof Error ? error.message : 'Unknown parsing error'
          })
        }
      },
      error: (error) => {
        resolve({
          data: [],
          error: `Failed to parse CSV: ${error.message}`
        })
      }
    })
  })
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
