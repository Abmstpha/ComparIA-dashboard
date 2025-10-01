import type { MetricName, ParsedMetricLabel } from '../types'

const SUPPORTED_METRICS: MetricName[] = [
  'quality',
  'latency_s',
  'energy_wh',
  'co2_g',
  'led_hours',
  'onlinevideo_min'
]

export function parseMetricLabel(metricLabel: string): ParsedMetricLabel | null {
  const trimmed = metricLabel.trim().toLowerCase()
  
  if (!trimmed) {
    return null
  }

  // Try to match any known metric at the END of the string
  for (const metric of SUPPORTED_METRICS) {
    const metricSuffix = `_${metric}`
    
    if (trimmed.endsWith(metricSuffix)) {
      const model = trimmed.slice(0, -metricSuffix.length)
      
      if (model) {
        return {
          model,
          metric
        }
      }
    }
    
    // Also try with hyphen separator
    const metricSuffixHyphen = `-${metric}`
    if (trimmed.endsWith(metricSuffixHyphen)) {
      const model = trimmed.slice(0, -metricSuffixHyphen.length)
      
      if (model) {
        return {
          model,
          metric
        }
      }
    }
  }

  return null
}

export function normalizeModelName(model: string): string {
  return model.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
}

export function normalizePromptId(prompt: string): string {
  return prompt.trim()
}

export function validateMetricName(metric: string): MetricName | null {
  const normalized = metric.toLowerCase().trim()
  return SUPPORTED_METRICS.find(m => m.toLowerCase() === normalized) || null
}
