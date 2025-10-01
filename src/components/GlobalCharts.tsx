import type { LongRow, ModelId, MetricName, PromptId, ViewMode } from '../types'
import { METRIC_LABELS } from '../types'
import KpiCards from './KpiCards'
import Heatmap from './Heatmap'
import ModelLineChart from './ModelLineChart'
import PromptLineChart from './PromptLineChart'
import LongTable from './LongTable'

interface GlobalChartsProps {
  longData: LongRow[]
  models: ModelId[]
  prompts: PromptId[]
  selectedMetric: MetricName
  viewMode: ViewMode
  selectedModels: ModelId[]
}

const GlobalCharts = ({
  longData,
  models,
  prompts,
  selectedMetric,
  viewMode,
  selectedModels
}: GlobalChartsProps) => {
  // Key metrics to show in charts - all displayed simultaneously
  const keyMetrics: MetricName[] = ['quality', 'latency_s', 'energy_wh']
  // Filter data based on view mode and selected models
  const filteredData = (() => {
    // For subset view with specific models selected
    if (viewMode === 'subset' && selectedModels.length > 0) {
      return longData.filter(row => selectedModels.includes(row.model))
    }
    
    // For global view, use ALL data from ALL models
    return longData
  })()

  const filteredModels = viewMode === 'subset' && selectedModels.length > 0 
    ? selectedModels 
    : models

  const getViewTitle = () => {
    switch (viewMode) {
      case 'global':
        return 'Global Overview - All Models'
      case 'subset':
        return `Subset Comparison - ${selectedModels.length} Models`
      default:
        return 'Dashboard Overview'
    }
  }

  const getViewDescription = () => {
    switch (viewMode) {
      case 'global':
        return 'Aggregated metrics across all models and prompts'
      case 'subset':
        return `Comparing selected models: ${selectedModels.join(', ')}`
      default:
        return 'Dashboard overview'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-1">
          {getViewTitle()}
        </h2>
        <p className="text-green-700 dark:text-green-300 text-sm">
          {getViewDescription()}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Key Performance Indicators - {getViewTitle()}
        </h3>
        <KpiCards data={filteredData} />
      </div>

      {/* Performance Heatmaps - All 3 Key Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Performance Heatmaps
        </h2>
        {keyMetrics.map(metric => (
          <div key={`heatmap-${metric}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {METRIC_LABELS[metric]} Heatmap
            </h3>
            <Heatmap
              longData={filteredData}
              models={filteredModels}
              prompts={prompts}
              selectedMetric={metric}
            />
          </div>
        ))}
      </div>

      {/* Model Performance Charts - All 3 Key Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Model Performance Averages
        </h2>
        {keyMetrics.map(metric => (
          <div key={`averages-${metric}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Model Performance Averages - {METRIC_LABELS[metric]}
            </h3>
            <ModelLineChart
              longData={filteredData}
              models={filteredModels}
              prompts={prompts}
              selectedMetric={metric}
              selectedModel="ALL"
            />
          </div>
        ))}
      </div>

      {/* Per-Prompt Performance Trends - All 3 Key Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Per-Prompt Performance Trends
        </h2>
        {keyMetrics.map(metric => (
          <div key={`trends-${metric}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Per-Prompt Performance Trends - {METRIC_LABELS[metric]}
            </h3>
            <PromptLineChart
              longData={filteredData}
              models={filteredModels}
              prompts={prompts}
              selectedMetric={metric}
              selectedModel="ALL"
            />
          </div>
        ))}
      </div>

      {/* Data Tables */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Data Tables
          Detailed Data View
        </h3>
        <div className="max-h-96 overflow-auto">
          <LongTable data={filteredData} />
        </div>
      </div>

      {/* Summary Stats */}
      {viewMode === 'subset' && selectedModels.length > 1 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Model Comparison Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedModels.map(model => {
              const modelData = filteredData.filter(row => row.model === model)
              const avgQuality = modelData
                .filter(row => row.metric === 'quality')
                .reduce((sum, row, _, arr) => sum + (row.value || 0) / arr.length, 0)
              const avgLatency = modelData
                .filter(row => row.metric === 'latency_s')
                .reduce((sum, row, _, arr) => sum + (row.value || 0) / arr.length, 0)
              const avgEnergy = modelData
                .filter(row => row.metric === 'energy_wh')
                .reduce((sum, row, _, arr) => sum + (row.value || 0) / arr.length, 0)

              return (
                <div key={model} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {model}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                      <span className="font-medium">{avgQuality.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                      <span className="font-medium">{avgLatency.toFixed(3)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Energy:</span>
                      <span className="font-medium">{avgEnergy.toFixed(4)}Wh</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalCharts
