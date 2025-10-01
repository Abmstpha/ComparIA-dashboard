import { useState, useEffect, useCallback } from 'react'
import type { AppState, MatrixRow, ModelSelection, ViewMode } from './types'
import { matrixToLong, getUniqueModels, getUniquePrompts, getUniqueMetrics } from './lib/reshape'
import { decodeUrlState, updateUrlState } from './lib/urlState'
import { loadCSVData } from './lib/csvLoader'
import ModelSelector from './components/ModelSelector'
import GlobalCharts from './components/GlobalCharts'
import ModelDetail from './components/ModelDetail'
import PromptDrilldown from './components/PromptDrilldown'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  const [state, setState] = useState<AppState>({
    matrixData: [],
    longData: [],
    models: [],
    prompts: [],
    metrics: [],
    filters: {
      selectedModel: 'ALL',
      selectedPrompt: 'ALL',
      selectedMetric: 'quality',
      modelSelection: {
        type: 'all',
        models: []
      },
      viewMode: 'global',
      drilldownPrompt: null
    },
    isLoading: false,
    error: null
  })

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  // Load URL state on mount
  useEffect(() => {
    const urlState = decodeUrlState(window.location.hash, state.models, state.prompts)
    if (Object.keys(urlState).length > 0) {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, ...urlState }
      }))
    }
  }, [state.models, state.prompts])

  // Update URL when filters change
  useEffect(() => {
    updateUrlState(state.filters)
  }, [state.filters])

  const processData = useCallback((matrixData: MatrixRow[]) => {
    const longData = matrixToLong(matrixData)
    
    const models = getUniqueModels(longData)
    const prompts = getUniquePrompts(longData)
    const metrics = getUniqueMetrics(longData)

    setState(prev => ({
      ...prev,
      matrixData,
      longData,
      models,
      prompts,
      metrics,
      error: null
    }))
  }, [])

  // Load CSV data on mount
  useEffect(() => {
    const loadData = async () => {
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        const csvData = await loadCSVData()
        processData(csvData)
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to load CSV data',
          isLoading: false 
        }))
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }
    
    loadData()
  }, [processData])



  const handleModelSelectionChange = (modelSelection: ModelSelection) => {
    console.log('handleModelSelectionChange called with:', modelSelection)
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        modelSelection,
        // Reset drill-down when changing model selection
        drilldownPrompt: modelSelection.type === 'single' ? prev.filters.drilldownPrompt : null
      }
    }))
  }

  const handleViewModeChange = (viewMode: ViewMode) => {
    console.log('handleViewModeChange called with:', viewMode)
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        viewMode,
        // Reset drill-down when switching away from prompt mode
        drilldownPrompt: viewMode === 'prompt' ? prev.filters.drilldownPrompt : null
      }
    }))
  }

  const handlePromptSelect = (promptId: string) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        drilldownPrompt: promptId,
        viewMode: 'prompt'
      }
    }))
  }

  // Debug current state
  console.log('App render - Current state:', {
    viewMode: state.filters.viewMode,
    modelSelection: state.filters.modelSelection,
    selectedMetric: state.filters.selectedMetric
  })


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ComparIA Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Compare AI model performance across prompts
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="btn-secondary"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="sidebar p-6 space-y-6 overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            <h3 className="section-header">Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading data from <code>results.csv</code> - 4 AI models across 30 prompts with 6 KPI metrics.
            </p>
          </div>
          
          <ModelSelector
            models={state.models}
            modelSelection={state.filters.modelSelection}
            viewMode={state.filters.viewMode}
            onModelSelectionChange={handleModelSelectionChange}
            onViewModeChange={handleViewModeChange}
          />
        </aside>

        {/* Main Content */}
        <main className="main-content p-6 space-y-6">
          {state.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Loading CSV Data...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Processing benchmark data from CSV file
                </p>
              </div>
            </div>
          ) : state.error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Error Loading Data
                </h2>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {state.error}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="view-transition animate-fade-in">
              {/* Render based on view mode */}
              {(state.filters.viewMode === 'global' || state.filters.viewMode === 'subset') && (
                <GlobalCharts
                  longData={state.longData}
                  models={state.models}
                  prompts={state.prompts}
                  selectedMetric={state.filters.selectedMetric}
                  viewMode={state.filters.viewMode}
                  selectedModels={state.filters.modelSelection.models}
                />
              )}

              {state.filters.viewMode === 'model' && state.filters.modelSelection.type === 'single' && (
                <ModelDetail
                  longData={state.longData}
                  modelId={state.filters.modelSelection.models[0]}
                  prompts={state.prompts}
                  metrics={state.metrics}
                />
              )}

              {state.filters.viewMode === 'prompt' && state.filters.modelSelection.type === 'single' && (
                <PromptDrilldown
                  longData={state.longData}
                  modelId={state.filters.modelSelection.models[0]}
                  selectedPrompt={state.filters.drilldownPrompt}
                  prompts={state.prompts}
                  metrics={state.metrics}
                  onPromptSelect={handlePromptSelect}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
