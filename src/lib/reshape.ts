import type { MatrixRow, LongRow, Factors, MetricName, ModelId, PromptId } from '../types'
import { parseMetricLabel } from './parse'

export function matrixToLong(matrixData: MatrixRow[]): LongRow[] {
  const longData: LongRow[] = []

  for (const row of matrixData) {
    const parsed = parseMetricLabel(row.metricLabel)
    
    if (!parsed) {
      console.warn(`Could not parse metric label: ${row.metricLabel}`)
      continue
    }

    const { model, metric } = parsed

    Object.entries(row.values).forEach(([prompt, value]) => {
      if (value !== null && !isNaN(value)) {
        longData.push({
          model,
          prompt,
          metric,
          value
        })
      }
    })
  }

  // Debug: Check what metrics we actually parsed
  const metricsPresent = new Set(longData.map(r => r.metric))
  console.log('[metrics present]', Array.from(metricsPresent))
  console.log('[longData sample]', longData.slice(0, 10))

  return longData
}

export function addDerivedMetrics(
  longData: LongRow[],
  factors: Factors,
  overrideWithDerived: boolean = false
): LongRow[] {
  const result = [...longData]
  
  // Group by model and prompt to find energy values
  const energyMap = new Map<string, number>()
  const existingMetrics = new Set<string>()
  
  longData.forEach(row => {
    const key = `${row.model}:${row.prompt}`
    
    if (row.metric === 'energy_wh') {
      energyMap.set(key, row.value)
    }
    
    // Track existing derived metrics
    if (['co2_g', 'led_minutes', 'onlinevideo_min'].includes(row.metric)) {
      existingMetrics.add(`${key}:${row.metric}`)
    }
  })

  // Generate derived metrics
  energyMap.forEach((energyWh, key) => {
    const [model, prompt] = key.split(':')
    
    const derivedMetrics: Array<{ metric: MetricName; value: number }> = [
      {
        metric: 'co2_g',
        value: (energyWh / 1000) * factors.gridIntensityGCO2PerKwh
      },
      {
        metric: 'led_minutes',
        value: (energyWh / factors.ledBulbWatts) * 60
      },
      {
        metric: 'onlinevideo_min',
        value: energyWh / factors.onlineVideoWhPerMin
      }
    ]

    derivedMetrics.forEach(({ metric, value }) => {
      const metricKey = `${key}:${metric}`
      const shouldAdd = overrideWithDerived || !existingMetrics.has(metricKey)
      
      if (shouldAdd) {
        // Remove existing if overriding
        if (overrideWithDerived) {
          const existingIndex = result.findIndex(
            row => row.model === model && row.prompt === prompt && row.metric === metric
          )
          if (existingIndex >= 0) {
            result.splice(existingIndex, 1)
          }
        }
        
        result.push({
          model,
          prompt,
          metric,
          value: Math.round(value * 1000) / 1000 // Round to 3 decimal places
        })
      }
    })
  })

  return result
}

export function getUniqueModels(longData: LongRow[]): ModelId[] {
  const models = new Set<ModelId>()
  longData.forEach(row => models.add(row.model))
  return Array.from(models).sort()
}

export function getUniquePrompts(longData: LongRow[]): PromptId[] {
  const prompts = new Set<PromptId>()
  longData.forEach(row => prompts.add(row.prompt))
  return Array.from(prompts).sort((a, b) => {
    // Sort prompts numerically if they follow p01, p02 pattern
    const aMatch = a.match(/^p(\d+)$/)
    const bMatch = b.match(/^p(\d+)$/)
    
    if (aMatch && bMatch) {
      return parseInt(aMatch[1]) - parseInt(bMatch[1])
    }
    
    return a.localeCompare(b)
  })
}

export function getUniqueMetrics(longData: LongRow[]): MetricName[] {
  const metrics = new Set<MetricName>()
  longData.forEach(row => metrics.add(row.metric))
  return Array.from(metrics).sort()
}

export function filterLongData(
  longData: LongRow[],
  selectedModel: ModelId | 'ALL',
  selectedPrompt: PromptId | 'ALL',
  selectedMetric?: MetricName
): LongRow[] {
  return longData.filter(row => {
    const modelMatch = selectedModel === 'ALL' || row.model === selectedModel
    const promptMatch = selectedPrompt === 'ALL' || row.prompt === selectedPrompt
    const metricMatch = !selectedMetric || row.metric === selectedMetric
    
    return modelMatch && promptMatch && metricMatch
  })
}
