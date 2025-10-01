import Papa from 'papaparse'
import type { MatrixRow } from '../types'

export async function loadCSVData(): Promise<MatrixRow[]> {
  const response = await fetch('/results.csv')
  
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status}`)
  }
  
  const csvText = await response.text()
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, unknown>[]
          
          const matrixData: MatrixRow[] = data.map((row) => {
            const { metric, ...values } = row
            const metricLabel = String(metric || '').trim()
            
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

          resolve(matrixData)
        } catch (error) {
          reject(error)
        }
      },
      error: (error: Error) => {
        reject(error)
      }
    })
  })
}
