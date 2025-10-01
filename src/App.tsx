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
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Compare AI model performance across prompts
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created by <span className="font-medium text-gray-700 dark:text-gray-300">Abmstpha</span>
              </span>
              <div className="flex items-center gap-2">
                <a 
                  href="https://github.com/Abmstpha/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  title="GitHub Profile"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/Abmstpha" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  title="LinkedIn Profile"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="sidebar p-6 space-y-6 overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
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
