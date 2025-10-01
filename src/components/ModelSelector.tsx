import { useState } from 'react'
import type { ModelId, ModelSelection, ViewMode } from '../types'

interface ModelSelectorProps {
  models: ModelId[]
  modelSelection: ModelSelection
  viewMode: ViewMode
  onModelSelectionChange: (selection: ModelSelection) => void
  onViewModeChange: (mode: ViewMode) => void
}

const ModelSelector = ({ 
  models, 
  modelSelection, 
  viewMode,
  onModelSelectionChange,
  onViewModeChange 
}: ModelSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAllModels = () => {
    onModelSelectionChange({
      type: 'all',
      models: []
    })
    onViewModeChange('global')
  }

  const handleModelToggle = (modelId: ModelId) => {
    const currentModels = modelSelection.models
    const isSelected = currentModels.includes(modelId)
    
    let newModels: ModelId[]
    if (isSelected) {
      newModels = currentModels.filter(m => m !== modelId)
    } else {
      newModels = [...currentModels, modelId]
    }

    // Determine selection type (but don't change view mode automatically)
    let newType: ModelSelection['type']

    if (newModels.length === 0) {
      newType = 'all'
    } else if (newModels.length === 1) {
      newType = 'single'
    } else {
      newType = 'subset'
    }

    onModelSelectionChange({
      type: newType,
      models: newModels
    })
    // Don't automatically change view mode - let user click "Apply Filter"
  }

  const handleApplyFilter = () => {
    // Apply the appropriate view mode based on current selection
    let newViewMode: ViewMode

    if (modelSelection.type === 'all') {
      newViewMode = 'global'
    } else if (modelSelection.type === 'single') {
      newViewMode = 'model'
    } else {
      newViewMode = 'subset'
    }

    onViewModeChange(newViewMode)
  }

  const getSelectionSummary = () => {
    switch (modelSelection.type) {
      case 'all':
        return 'All Models'
      case 'single':
        return modelSelection.models[0]
      case 'subset':
        return `${modelSelection.models.length} Models`
      default:
        return 'All Models'
    }
  }

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'global':
        return 'Global View (Averages)'
      case 'subset':
        return 'Subset Comparison'
      case 'model':
        return 'Model Detail View'
      case 'prompt':
        return 'Prompt Drill-down'
      default:
        return 'Global View'
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="section-header">Model Selection</h3>
        
        {/* Current Selection Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {getSelectionSummary()}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {getViewModeLabel()}
          </div>
        </div>

        {/* All Models Option */}
        <div className="space-y-2">
          <button
            onClick={handleAllModels}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              modelSelection.type === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">All Models</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Global averages
              </span>
            </div>
          </button>

          {/* Individual Model Selection */}
          <div className="space-y-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isExpanded ? '▼' : '▶'} Individual Models ({models.length})
            </button>
            
            {isExpanded && (
              <div className="space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {models.map(model => (
                  <label
                    key={model}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={modelSelection.models.includes(model)}
                      onChange={() => handleModelToggle(model)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{model}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apply Filter Button */}
        {modelSelection.type !== 'all' && (
          <div className="pt-3">
            <button
              onClick={handleApplyFilter}
              className="w-full btn-primary text-sm py-2 px-4 rounded-lg font-medium transition-colors"
            >
              🎯 Apply Filter & View Dashboard
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {modelSelection.type === 'single' 
                ? `View detailed dashboard for ${modelSelection.models[0]}`
                : `Compare ${modelSelection.models.length} selected models`
              }
            </p>
          </div>
        )}

        {/* View Mode Controls for Single Model */}
        {modelSelection.type === 'single' && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Detail Level
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => onViewModeChange('model')}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  viewMode === 'model'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                📊 Model Overview (All Prompts)
              </button>
              <button
                onClick={() => onViewModeChange('prompt')}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  viewMode === 'prompt'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                🔍 Prompt Drill-down
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelSelector
