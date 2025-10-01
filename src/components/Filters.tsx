import type { FilterState, ModelId, PromptId, MetricName } from '../types'
import { METRIC_LABELS } from '../types'

interface FiltersProps {
  models: ModelId[]
  prompts: PromptId[]
  metrics: MetricName[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const Filters = ({
  models,
  prompts,
  metrics,
  filters,
  onFiltersChange
}: FiltersProps) => {
  const handleModelChange = (selectedModel: ModelId | 'ALL') => {
    onFiltersChange({ ...filters, selectedModel })
  }

  const handlePromptChange = (selectedPrompt: PromptId | 'ALL') => {
    onFiltersChange({ ...filters, selectedPrompt })
  }

  const handleMetricChange = (selectedMetric: MetricName) => {
    onFiltersChange({ ...filters, selectedMetric })
  }

  return (
    <div className="space-y-4">
      <h3 className="section-header">Filters</h3>
      
      <div className="space-y-3">
        <div>
          <label className="label">Model</label>
          <select
            value={filters.selectedModel}
            onChange={(e) => handleModelChange(e.target.value as ModelId | 'ALL')}
            className="select"
          >
            <option value="ALL">All Models</option>
            {models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Prompt</label>
          <select
            value={filters.selectedPrompt}
            onChange={(e) => handlePromptChange(e.target.value as PromptId | 'ALL')}
            className="select"
          >
            <option value="ALL">All Prompts</option>
            {prompts.map(prompt => (
              <option key={prompt} value={prompt}>
                {prompt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Metric</label>
          <select
            value={filters.selectedMetric}
            onChange={(e) => handleMetricChange(e.target.value as MetricName)}
            className="select"
          >
            {metrics.map(metric => (
              <option key={metric} value={metric}>
                {METRIC_LABELS[metric]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(filters.selectedModel !== 'ALL' || filters.selectedPrompt !== 'ALL') && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onFiltersChange({
              ...filters,
              selectedModel: 'ALL',
              selectedPrompt: 'ALL'
            })}
            className="btn-outline w-full text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default Filters
