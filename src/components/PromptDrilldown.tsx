import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, ModelId, PromptId, MetricName } from '../types'
import { METRIC_LABELS, METRIC_UNITS } from '../types'
import { exportChartAsPNG } from '../lib/export'

interface PromptDrilldownProps {
  longData: LongRow[]
  modelId: ModelId
  selectedPrompt: PromptId | null
  prompts: PromptId[]
  metrics: MetricName[]
  onPromptSelect: (prompt: PromptId) => void
}

const PromptDrilldown = ({ 
  longData, 
  modelId, 
  selectedPrompt, 
  prompts, 
  metrics,
  onPromptSelect 
}: PromptDrilldownProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Get data for selected prompt and model
  const getPromptData = () => {
    if (!selectedPrompt) return []
    
    return metrics.map(metric => {
      const dataPoint = longData.find(
        row => row.model === modelId && row.prompt === selectedPrompt && row.metric === metric
      )
      return {
        metric,
        value: dataPoint?.value ?? null,
        label: METRIC_LABELS[metric],
        unit: METRIC_UNITS[metric]
      }
    })
  }

  const promptData = getPromptData()

  // Create bar chart for prompt data
  useEffect(() => {
    if (!chartRef.current || !selectedPrompt || promptData.length === 0) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const validData = promptData.filter(d => d.value !== null)

    const option: echarts.EChartsOption = {
      title: {
        text: `${modelId} - ${selectedPrompt} Metrics`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0]
          const dataIndex = point.dataIndex
          const data = validData[dataIndex]
          return `${data.label}<br/>Value: ${point.value}${data.unit}`
        }
      },
      xAxis: {
        type: 'category',
        data: validData.map(d => d.label),
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: 'Value',
        nameTextStyle: {
          fontSize: 12
        },
        axisLabel: {
          fontSize: 10
        }
      },
      series: [{
        type: 'bar',
        data: validData.map(d => d.value),
        itemStyle: {
          color: (params: any) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          formatter: (params: any) => {
            const dataIndex = params.dataIndex
            const data = validData[dataIndex]
            return `${params.value}${data.unit}`
          }
        }
      }],
      grid: {
        left: '10%',
        right: '5%',
        bottom: '20%',
        top: '15%'
      }
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [selectedPrompt, promptData, modelId])

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  const handleExportChart = () => {
    if (chartInstance.current) {
      exportChartAsPNG(chartInstance.current as any, `${modelId}_${selectedPrompt}_metrics`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">
          Prompt Drill-down: {modelId}
        </h2>
        <p className="text-purple-700 dark:text-purple-300 text-sm">
          Detailed metrics for individual prompts
        </p>
      </div>

      {/* Prompt Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Select Prompt
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {prompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => onPromptSelect(prompt)}
              className={`p-3 text-sm rounded-lg border transition-colors ${
                selectedPrompt === prompt
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Prompt Data */}
      {selectedPrompt && (
        <>
          {/* Metrics Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedPrompt} - Metric Values
                </h3>
                <button
                  onClick={handleExportChart}
                  className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded transition-colors"
                >
                  Export Chart
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Metric
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {promptData.map((data, index) => (
                    <tr key={data.metric} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {data.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {data.value !== null ? data.value.toFixed(4) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {data.unit || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div
              ref={chartRef}
              className="w-full h-80"
            />
          </div>
        </>
      )}

      {/* No Prompt Selected State */}
      {!selectedPrompt && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Select a Prompt</h3>
            <p className="text-sm">Choose a prompt above to view detailed metrics for {modelId}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptDrilldown
