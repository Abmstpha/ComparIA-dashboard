export type ModelId = string
export type PromptId = string
export type MetricName = 
  | 'quality'
  | 'latency_s'
  | 'energy_wh'
  | 'co2_g'
  | 'led_hours'
  | 'onlinevideo_min'

export interface LongRow {
  model: ModelId
  prompt: PromptId
  metric: MetricName
  value: number
}

export interface MatrixRow {
  metricLabel: string
  values: Record<PromptId, number | null>
}

export interface ParsedMetricLabel {
  model: ModelId
  metric: MetricName
}

export interface Factors {
  ledBulbWatts: number
  gridIntensityGCO2PerKwh: number
  onlineVideoWhPerMin: number
}

export interface KpiData {
  meanQuality: number | null
  meanLatency: number | null
  p95Latency: number | null
  meanEnergy: number | null
  totalEnergy: number | null
  qualityPerWh: number | null
}

export type ViewMode = 'global' | 'subset' | 'model' | 'prompt'

export interface ModelSelection {
  type: 'all' | 'subset' | 'single'
  models: ModelId[]
}

export interface FilterState {
  selectedModel: ModelId | 'ALL'
  selectedPrompt: PromptId | 'ALL'
  selectedMetric: MetricName
  modelSelection: ModelSelection
  viewMode: ViewMode
  drilldownPrompt: PromptId | null
}

export interface AppState {
  matrixData: MatrixRow[]
  longData: LongRow[]
  models: ModelId[]
  prompts: PromptId[]
  metrics: MetricName[]
  filters: FilterState
  isLoading: boolean
  error: string | null
}

export interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

export interface HeatmapData {
  models: ModelId[]
  prompts: PromptId[]
  values: number[][]
  metric: MetricName
}

export const METRIC_LABELS: Record<MetricName, string> = {
  quality: 'Quality',
  latency_s: 'Latency (s)',
  energy_wh: 'Energy (Wh)',
  co2_g: 'CO₂ (g)',
  led_hours: 'LED Hours',
  onlinevideo_min: 'Online Video (min)',
}

export const METRIC_UNITS: Record<MetricName, string> = {
  quality: '',
  latency_s: 's',
  energy_wh: 'Wh',
  co2_g: 'g',
  led_hours: 'hours',
  onlinevideo_min: 'min',
}

export const DEFAULT_FACTORS: Factors = {
  ledBulbWatts: 7.0,
  gridIntensityGCO2PerKwh: 300,
  onlineVideoWhPerMin: 0.9,
}

export const DERIVED_METRICS: MetricName[] = ['co2_g', 'led_hours', 'onlinevideo_min']
