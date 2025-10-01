import type { LongRow, ModelId, MetricName, PromptId, ViewMode } from '../types'
import { METRIC_LABELS } from '../types'
import KpiCards from './KpiCards'
import Heatmap from './Heatmap'
import ModelLineChart from './ModelLineChart'
import PromptLineChart from './PromptLineChart'

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
  selectedMetric: _selectedMetric,
  viewMode,
  selectedModels
}: GlobalChartsProps) => {
  // Key metrics to show in charts - all displayed simultaneously
  const keyMetrics: MetricName[] = ['quality', 'latency_s', 'energy_wh']
  
  // Group prompts by difficulty/category levels
  const groupPromptsByCategory = (prompts: PromptId[]) => {
    const groups: { label: string; description: string; prompts: PromptId[] }[] = [
      {
        label: "Easy factual & rewriting (1-10)",
        description: "Basic factual questions and simple rewriting tasks",
        prompts: prompts.slice(0, 10)
      },
      {
        label: "Reasoning & quantitative (11-15)", 
        description: "Logical reasoning and quantitative analysis",
        prompts: prompts.slice(10, 15)
      },
      {
        label: "Programming & debugging (16-20)",
        description: "Code generation and debugging tasks", 
        prompts: prompts.slice(15, 20)
      },
      {
        label: "Harder knowledge & reasoning (21-25)",
        description: "Complex knowledge application and reasoning",
        prompts: prompts.slice(20, 25)
      },
      {
        label: "Advanced / creative & multi-step (26-30)",
        description: "Creative tasks and multi-step problem solving",
        prompts: prompts.slice(25, 30)
      }
    ]
    
    // Filter out empty groups
    return groups.filter(group => group.prompts.length > 0)
  }
  
  const promptGroups = groupPromptsByCategory(prompts)
  
  // Group models by size categories
  const groupModelsBySize = (models: ModelId[]) => {
    const groups: { label: string; description: string; models: ModelId[] }[] = [
      {
        label: "Small Models",
        description: "Meta LLaMA 3.1 8B, Gemma 8B - Efficient lightweight models",
        models: models.filter(model => 
          model.toLowerCase().includes('llama3.1_8b') || 
          model.toLowerCase().includes('gemma8b')
        )
      },
      {
        label: "Medium Models", 
        description: "Mistral Small, GPT-OSS 20B - Balanced performance and efficiency",
        models: models.filter(model => 
          model.toLowerCase().includes('mistralsmall') || 
          model.toLowerCase().includes('gptoss20b')
        )
      },
      {
        label: "Large Models",
        description: "GPT-5, DeepSeek R1 - High-performance flagship models",
        models: models.filter(model => 
          model.toLowerCase().includes('gpt5') || 
          model.toLowerCase().includes('deepseekr1')
        )
      }
    ]
    
    // Filter out empty groups and add any uncategorized models
    const categorizedModels = groups.flatMap(g => g.models)
    const uncategorizedModels = models.filter(m => !categorizedModels.includes(m))
    
    if (uncategorizedModels.length > 0) {
      groups.push({
        label: "Other Models",
        description: "Additional models not in standard size categories",
        models: uncategorizedModels
      })
    }
    
    return groups.filter(group => group.models.length > 0)
  }
  
  const modelGroups = groupModelsBySize(models)
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
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {getViewTitle()}
            </h2>
          </div>
          <p className="text-blue-700 dark:text-blue-300 text-base font-medium">
            {getViewDescription()}
          </p>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Performance Overview
          </h3>
        </div>
        <KpiCards data={filteredData} />
      </div>

      {/* Modern Performance Heatmaps */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🔥</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Performance Heatmaps
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Visual patterns across prompt categories</p>
          </div>
        </div>
        
        {keyMetrics.map((metric, metricIndex) => (
          <div key={`heatmap-${metric}`} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg ${
                metricIndex === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                metricIndex === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {METRIC_LABELS[metric]} Analysis
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {promptGroups.map((group, groupIndex) => (
                <div key={`heatmap-${metric}-group-${groupIndex}`} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {group.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      metricIndex === 0 ? 'bg-emerald-400' :
                      metricIndex === 1 ? 'bg-blue-400' : 'bg-purple-400'
                    } opacity-60`}></div>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <Heatmap
                      longData={filteredData}
                      models={filteredModels}
                      prompts={group.prompts}
                      selectedMetric={metric}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>



      {/* Modern Model Performance by Size */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🏆</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Model Size Categories
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Performance comparison by model complexity</p>
          </div>
        </div>
        
        {keyMetrics.map((metric, metricIndex) => (
          <div key={`model-groups-${metric}`} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg ${
                metricIndex === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                metricIndex === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {METRIC_LABELS[metric]} by Model Size
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {modelGroups.map((group, groupIndex) => (
                <div key={`model-group-${metric}-${groupIndex}`} className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full ${
                      groupIndex === 0 ? 'bg-green-400' :
                      groupIndex === 1 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {group.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <ModelLineChart
                      longData={filteredData}
                      models={group.models}
                      prompts={prompts}
                      selectedMetric={metric}
                      selectedModel="ALL"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Per-Prompt Performance Trends - All 3 Key Metrics with Grouped Prompts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Per-Prompt Performance Trends by Groups
        </h2>
        {keyMetrics.map(metric => (
          <div key={`trends-${metric}`} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {METRIC_LABELS[metric]} Trends by Prompt Groups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {promptGroups.map((group, groupIndex) => (
                <div key={`trends-${metric}-group-${groupIndex}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {group.label}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {group.description}
                  </p>
                  <PromptLineChart
                    longData={filteredData}
                    models={filteredModels}
                    prompts={group.prompts}
                    selectedMetric={metric}
                    selectedModel="ALL"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
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
