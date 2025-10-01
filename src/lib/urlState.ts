import type { FilterState, MetricName, ModelId, PromptId, ViewMode, ModelSelection } from '../types'

export function encodeUrlState(filters: FilterState): string {
  const params = new URLSearchParams()
  
  // Legacy model selection for backward compatibility
  if (filters.selectedModel !== 'ALL') {
    params.set('model', filters.selectedModel)
  }
  
  if (filters.selectedPrompt !== 'ALL') {
    params.set('prompt', filters.selectedPrompt)
  }
  
  params.set('metric', filters.selectedMetric)
  
  // New model selection system
  if (filters.modelSelection.type !== 'all') {
    params.set('selectionType', filters.modelSelection.type)
    if (filters.modelSelection.models.length > 0) {
      params.set('selectedModels', filters.modelSelection.models.join(','))
    }
  }
  
  // View mode
  if (filters.viewMode !== 'global') {
    params.set('viewMode', filters.viewMode)
  }
  
  // Drill-down prompt
  if (filters.drilldownPrompt) {
    params.set('drilldownPrompt', filters.drilldownPrompt)
  }
  
  return params.toString()
}

export function decodeUrlState(
  hash: string,
  availableModels: ModelId[],
  availablePrompts: PromptId[]
): Partial<FilterState> {
  const params = new URLSearchParams(hash.replace('#', ''))
  const state: Partial<FilterState> = {}
  
  // Legacy model selection - convert to new system
  const model = params.get('model')
  if (model && (model === 'ALL' || availableModels.includes(model))) {
    state.selectedModel = model as ModelId | 'ALL'
    
    // Convert legacy model selection to new modelSelection format
    if (model === 'ALL') {
      state.modelSelection = {
        type: 'all',
        models: []
      }
      state.viewMode = 'global'
    } else {
      state.modelSelection = {
        type: 'single',
        models: [model]
      }
      state.viewMode = 'model'
    }
  }
  
  const prompt = params.get('prompt')
  if (prompt && (prompt === 'ALL' || availablePrompts.includes(prompt))) {
    state.selectedPrompt = prompt as PromptId | 'ALL'
  }
  
  const metric = params.get('metric')
  const validMetrics: MetricName[] = [
    'quality',
    'latency_s',
    'energy_wh',
    'co2_g',
    'led_hours',
    'onlinevideo_min'
  ]
  
  if (metric && validMetrics.includes(metric as MetricName)) {
    state.selectedMetric = metric as MetricName
  }
  
  // New model selection system (takes priority over legacy)
  const selectionType = params.get('selectionType')
  const selectedModelsParam = params.get('selectedModels')
  
  if (selectionType && ['all', 'subset', 'single'].includes(selectionType)) {
    const selectedModels = selectedModelsParam 
      ? selectedModelsParam.split(',').filter(m => availableModels.includes(m))
      : []
    
    state.modelSelection = {
      type: selectionType as ModelSelection['type'],
      models: selectedModels
    }
    
    // Override legacy model selection if new system is present
    if (selectionType === 'all') {
      state.selectedModel = 'ALL'
      state.viewMode = 'global'
    } else if (selectionType === 'single' && selectedModels.length === 1) {
      state.selectedModel = selectedModels[0]
      state.viewMode = 'model'
    } else if (selectionType === 'subset') {
      state.selectedModel = 'ALL' // For subset, we don't use legacy selectedModel
      state.viewMode = 'subset'
    }
  }
  
  // View mode
  const viewMode = params.get('viewMode')
  if (viewMode && ['global', 'subset', 'model', 'prompt'].includes(viewMode)) {
    state.viewMode = viewMode as ViewMode
  }
  
  // Drill-down prompt
  const drilldownPrompt = params.get('drilldownPrompt')
  if (drilldownPrompt && availablePrompts.includes(drilldownPrompt)) {
    state.drilldownPrompt = drilldownPrompt
  }
  
  return state
}

export function updateUrlState(filters: FilterState): void {
  const encoded = encodeUrlState(filters)
  const newHash = encoded ? `#${encoded}` : ''
  
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash)
  }
}
