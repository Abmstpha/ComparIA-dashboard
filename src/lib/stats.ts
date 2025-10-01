import type { LongRow, MetricName, KpiData } from '../types'

export function calculateMean(values: number[]): number | null {
  if (values.length === 0) return null
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v))
  if (validValues.length === 0) return null
  const sum = validValues.reduce((acc, val) => acc + val, 0)
  return sum / validValues.length
}

export function calculateSum(values: number[]): number | null {
  if (values.length === 0) return null
  const validValues = values.filter(v => !isNaN(v) && isFinite(v))
  if (validValues.length === 0) return null
  
  return validValues.reduce((acc, val) => acc + val, 0)
}

export function calculateP95(values: number[]): number | null {
  if (values.length === 0) return null
  const validValues = values.filter(v => !isNaN(v) && isFinite(v))
  if (validValues.length === 0) return null
  
  const sorted = [...validValues].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, index)]
}

// Helper function to calculate per-model averages and return both individual and macro averages
function calculatePerModelAverages(longData: LongRow[], metric: MetricName): {
  perModelAverages: Map<string, number>
  macroAverage: number | null
} {
  const byModel = new Map<string, number[]>()
  
  // Group values by model
  for (const row of longData) {
    if (row.metric !== metric || !Number.isFinite(row.value)) continue
    const arr = byModel.get(row.model) ?? []
    arr.push(row.value)
    byModel.set(row.model, arr)
  }
  
  // Calculate mean for each model
  const perModelAverages = new Map<string, number>()
  const validMeans: number[] = []
  
  for (const [model, values] of byModel.entries()) {
    if (values.length > 0) {
      const mean = values.reduce((a,b) => a+b, 0) / values.length
      perModelAverages.set(model, mean)
      validMeans.push(mean)
      console.log(`[model-avg] ${model} ${metric}: ${mean.toFixed(3)} (from ${values.length} values)`)
    }
  }
  
  // Calculate macro average (average of per-model averages)
  const macroAverage = validMeans.length > 0 
    ? validMeans.reduce((a,b) => a+b, 0) / validMeans.length 
    : null
  
  if (macroAverage !== null) {
    console.log(`[macro-avg] Final ${metric}: ${macroAverage.toFixed(3)} (average of ${validMeans.length} model averages)`)
  }
  
  return { perModelAverages, macroAverage }
}

export function calculateKpis(longData: LongRow[]): KpiData {
  // Debug: Check what metrics are available
  const metricsPresent = new Set(longData.map(r => r.metric))
  console.log('[calculateKpis] metrics present:', Array.from(metricsPresent))
  
  // Check if we have multiple models (use macro-average) or single model (use micro-average)
  const uniqueModels = new Set(longData.map(r => r.model))
  const useMacroAverage = uniqueModels.size > 1
  
  console.log(`[calculateKpis] Using ${useMacroAverage ? 'MACRO' : 'MODEL'} average for ${uniqueModels.size} models`)

  let meanQuality: number | null
  let meanLatency: number | null  
  let meanEnergy: number | null
  
  if (useMacroAverage) {
    // Multiple models: use macro-average (average of per-model averages)
    const qualityData = calculatePerModelAverages(longData, 'quality')
    const latencyData = calculatePerModelAverages(longData, 'latency_s')
    const energyData = calculatePerModelAverages(longData, 'energy_wh')
    
    meanQuality = qualityData.macroAverage
    meanLatency = latencyData.macroAverage
    meanEnergy = energyData.macroAverage
  } else {
    // Single model: use the pre-calculated model average (consistent with macro calculation)
    const singleModel = Array.from(uniqueModels)[0]
    console.log(`[calculateKpis] Single model selected: ${singleModel}`)
    
    const qualityData = calculatePerModelAverages(longData, 'quality')
    const latencyData = calculatePerModelAverages(longData, 'latency_s')
    const energyData = calculatePerModelAverages(longData, 'energy_wh')
    
    meanQuality = qualityData.perModelAverages.get(singleModel) ?? null
    meanLatency = latencyData.perModelAverages.get(singleModel) ?? null
    meanEnergy = energyData.perModelAverages.get(singleModel) ?? null
    
    console.log(`[calculateKpis] Model averages - Quality: ${meanQuality?.toFixed(3)}, Latency: ${meanLatency?.toFixed(3)}, Energy: ${meanEnergy?.toFixed(6)}`)
  }

  // P95 and Total always use all individual values
  const latencyValues = longData.filter(row => row.metric === 'latency_s').map(row => row.value)
  const energyValues = longData.filter(row => row.metric === 'energy_wh').map(row => row.value)
  
  const p95Latency = calculateP95(latencyValues)
  const totalEnergy = calculateSum(energyValues)
  
  // Calculate quality per Wh
  let qualityPerWh: number | null = null
  if (meanQuality !== null && meanEnergy !== null && meanEnergy > 0) {
    qualityPerWh = meanQuality / meanEnergy
  }

  return {
    meanQuality: meanQuality !== null ? Math.round(meanQuality * 100) / 100 : null,
    meanLatency: meanLatency !== null ? Math.round(meanLatency * 1000) / 1000 : null,
    p95Latency: p95Latency !== null ? Math.round(p95Latency * 1000) / 1000 : null,
    meanEnergy: meanEnergy !== null ? Math.round(meanEnergy * 10000) / 10000 : null,
    totalEnergy: totalEnergy !== null ? Math.round(totalEnergy * 10000) / 10000 : null,
    qualityPerWh: qualityPerWh !== null ? Math.round(qualityPerWh * 100) / 100 : null,
  }
}

export function getMetricValues(
  longData: LongRow[],
  metric: string,
  models: string[],
  prompts: string[]
): number[][] {
  const result: number[][] = []
  
  for (let i = 0; i < models.length; i++) {
    const row: number[] = []
    for (let j = 0; j < prompts.length; j++) {
      const dataPoint = longData.find(
        d => d.model === models[i] && d.prompt === prompts[j] && d.metric === metric
      )
      row.push(dataPoint?.value ?? NaN)
    }
    result.push(row)
  }
  
  return result
}

export function getMinMax(values: number[][]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  
  for (const row of values) {
    for (const value of row) {
      if (!isNaN(value) && isFinite(value)) {
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    }
  }
  
  if (min === Infinity || max === -Infinity) {
    return { min: 0, max: 1 }
  }
  
  return { min, max }
}
