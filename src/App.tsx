import { useState, useEffect, useCallback } from 'react'
import type { AppState, MatrixRow, ModelSelection, ViewMode } from './types'
import { matrixToLong, getUniqueModels, getUniquePrompts, getUniqueMetrics } from './lib/reshape'
import { decodeUrlState, updateUrlState } from './lib/urlState'
import { loadCSVData } from './lib/csvLoader'
import ModelSelector from './components/ModelSelector'
import GlobalCharts from './components/GlobalCharts'
import PromptDrilldown from './components/PromptDrilldown'
import ModelDetail from './components/ModelDetail'
import './styles/modern.css'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  
  const [sidebarVisible, setSidebarVisible] = useState(true)
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
      viewMode: 'model',
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

  const handleGoHome = () => {
    // Reset state to home
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        modelSelection: { type: 'all', models: [] },
        viewMode: 'global',
        drilldownPrompt: null
      }
    }))
    
    // Navigate to root URL
    window.location.href = '/ComparIA-dashboard/'
  }

  // Debug current state
  console.log('App render - Current state:', {
    viewMode: state.filters.viewMode,
    modelSelection: state.filters.modelSelection,
    selectedMetric: state.filters.selectedMetric
  })


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      {/* Ultra-Modern Header */}
      <header className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 px-6 lg:px-8 py-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex items-start lg:items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-ping opacity-30"></div>
              </div>
              <h1 
                onClick={handleGoHome}
                className="text-2xl lg:text-4xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 dark:from-slate-200 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                ComparIA Dashboard
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-base lg:text-lg font-medium hidden sm:block mb-3">
              Compare AI model performance across prompts with real-time analytics
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100/80 to-blue-100/80 dark:from-slate-800/80 dark:to-blue-900/80 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Created by <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Abdellahi El Moustapha</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="https://github.com/Abmstpha/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100/80 to-slate-100/80 dark:from-gray-800/80 dark:to-slate-800/80 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  title="GitHub Profile"
                >
                  <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors hidden sm:inline">GitHub</span>
                </a>
                <a 
                  href="https://linkedin.com/in/Abmstpha" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 dark:from-blue-900/80 dark:to-indigo-900/80 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  title="LinkedIn Profile"
                >
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors hidden sm:inline">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-blue-100/80 to-indigo-100/80 dark:from-slate-800/80 dark:to-blue-900/80 hover:from-blue-200/80 hover:to-indigo-200/80 dark:hover:from-slate-700/80 dark:hover:to-blue-800/80 border border-white/20 dark:border-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ml-3 flex-shrink-0"
            title="Toggle sidebar"
          >
            <div className="text-xl group-hover:scale-110 transition-transform duration-300">
              {sidebarVisible ? '◀️' : '▶️'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-yellow-100/80 to-orange-100/80 dark:from-slate-800/80 dark:to-blue-900/80 hover:from-yellow-200/80 hover:to-orange-200/80 dark:hover:from-slate-700/80 dark:hover:to-blue-800/80 border border-white/20 dark:border-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ml-3 flex-shrink-0"
            title="Toggle dark mode"
          >
            <div className="text-xl group-hover:scale-110 transition-transform duration-300">
              {isDarkMode ? '☀️' : '🌙'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 dark:from-blue-400/20 dark:to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Ultra-Modern Sidebar */}
        {sidebarVisible && (
          <aside className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 lg:p-8 space-y-6 lg:space-y-8 lg:overflow-y-auto lg:w-96 w-full lg:h-full border-b lg:border-b-0 lg:border-r border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] lg:flex-shrink-0 transition-all duration-300">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-2xl animate-pulse delay-500"></div>
            <div className="absolute bottom-1/4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-400/5 to-cyan-400/5 rounded-full blur-xl animate-pulse delay-1500"></div>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Dataset Overview</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Real-time KPI metrics from <span className="font-semibold text-blue-600 dark:text-blue-400">6 AI models</span> across <span className="font-semibold text-purple-600 dark:text-purple-400">30 prompts</span> with difficulty-based performance patterns
              </p>
            </div>
          </div>
          
          <ModelSelector
            models={state.models}
            modelSelection={state.filters.modelSelection}
            viewMode={state.filters.viewMode}
            onModelSelectionChange={handleModelSelectionChange}
            onViewModeChange={handleViewModeChange}
          />
        </aside>
        )}

        {/* Ultra-Modern Main Content */}
        <main className="relative flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-indigo-50/10 dark:from-slate-900/50 dark:via-slate-800/30 dark:to-blue-900/10 p-6 lg:p-10 space-y-8 lg:space-y-12 h-full">
          {state.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-pulse-glow">
                <div className="relative mb-8">
                  <div className="loading-spinner mx-auto"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                  Loading CSV Data...
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Processing benchmark data from CSV file
                </p>
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : state.error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-10 bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-3xl border border-red-200/50 dark:border-red-700/50 shadow-[0_8px_32px_rgba(239,68,68,0.15)] dark:shadow-[0_8px_32px_rgba(239,68,68,0.3)] max-w-md">
                <div className="relative mb-6">
                  <div className="text-6xl mb-4 animate-bounce">⚠️</div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 rounded-full blur-2xl animate-pulse"></div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
                  Error Loading Data
                </h2>
                <p className="text-red-600 dark:text-red-400 mb-6 text-base leading-relaxed bg-red-100/50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200/50 dark:border-red-700/50">
                  {state.error}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="group px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-500/30"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Loading
                  </span>
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
