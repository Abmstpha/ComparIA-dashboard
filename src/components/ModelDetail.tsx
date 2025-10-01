import { useState } from 'react'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, ModelId, MetricName, PromptId } from '../types'
import { METRIC_LABELS, METRIC_UNITS } from '../types'
import { calculateKpis } from '../lib/stats'
import { exportChartAsPNG } from '../lib/export'

interface ModelDetailProps {
  longData: LongRow[]
  modelId: ModelId
  prompts: PromptId[]
  metrics: MetricName[]
}

const ModelDetail = ({ longData, modelId, prompts, metrics }: ModelDetailProps) => {
  const [activeMetric, setActiveMetric] = useState<MetricName>('quality')
  const chartRefs = useRef<Record<MetricName, HTMLDivElement | null>>({} as Record<MetricName, HTMLDivElement | null>)
  const chartInstances = useRef<Record<MetricName, echarts.ECharts | null>>({} as Record<MetricName, echarts.ECharts | null>)

  // Filter data for this model
  const modelData = longData.filter(row => row.model === modelId)
  const kpis = calculateKpis(modelData)

  // Create chart for a specific metric
  const createChart = (metric: MetricName) => {
    const chartRef = chartRefs.current[metric]
    if (!chartRef || !prompts.length) return

    // Get data for this metric
    const data = prompts.map(prompt => {
      const dataPoint = modelData.find(d => d.prompt === prompt && d.metric === metric)
      return dataPoint?.value ?? null
    })

    // Initialize chart if not exists
    if (!chartInstances.current[metric]) {
      chartInstances.current[metric] = echarts.init(chartRef)
    }

    const chart = chartInstances.current[metric]!
    
    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[metric]} Across Prompts`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        textStyle: {
          color: '#374151',
          fontSize: 13
        },
        formatter: (params: any) => {
          const point = params[0]
          const value = point.value
          return `<div style="font-weight: 600; margin-bottom: 4px;">${point.axisValue}</div>${METRIC_LABELS[metric]}: <span style="font-weight: 600; color: #3b82f6;">${
            value !== null ? `${value}${METRIC_UNITS[metric]}` : 'N/A'
          }</span>`
        }
      },
      xAxis: {
        type: 'category',
        data: prompts,
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#6b7280',
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
            width: 2
          }
        }
      },
      yAxis: {
        type: 'value',
        name: METRIC_LABELS[metric],
        nameTextStyle: {
          fontSize: 12,
          color: '#6b7280',
          fontWeight: 600
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
          formatter: (value: number) => `${value}${METRIC_UNITS[metric]}`
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
            width: 2
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            width: 1,
            type: 'dashed'
          }
        }
      },
      series: [{
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
              offset: 0, color: '#3b82f6'
            }, {
              offset: 1, color: '#6366f1'
            }]
          },
          shadowColor: 'rgba(59, 130, 246, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 3
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowColor: 'rgba(59, 130, 246, 0.4)',
          shadowBlur: 8
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.2)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.02)'
            }]
          }
        },
        connectNulls: false
      }],
      grid: {
        left: '12%',
        right: '8%',
        bottom: '20%',
        top: '18%'
      }
    }

    chart.setOption(option)
  }

  // Update charts when data changes
  useEffect(() => {
    metrics.forEach(metric => {
      createChart(metric)
    })

    // Cleanup function
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) {
          chart.dispose()
        }
      })
      chartInstances.current = {} as Record<MetricName, echarts.ECharts | null>
    }
  }, [modelData, prompts, metrics])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) {
          chart.resize()
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleExportChart = (metric: MetricName) => {
    const chart = chartInstances.current[metric]
    if (chart) {
      exportChartAsPNG(chart as any, `${modelId}_${metric}_chart`)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Model Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 p-6 lg:p-8 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent mb-3">
          {modelId} - Detailed Analysis
        </h2>
        <p className="text-blue-600 dark:text-blue-300 text-base lg:text-lg font-medium">
          Performance metrics across {prompts.length} prompts
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Avg Quality', value: kpis.meanQuality, unit: '', icon: '⭐', decimals: 1, gradient: 'from-yellow-400 to-orange-500' },
          { label: 'Avg Latency', value: kpis.meanLatency, unit: 's', icon: '⚡', decimals: 3, gradient: 'from-blue-400 to-cyan-500' },
          { label: 'Avg Energy', value: kpis.meanEnergy, unit: 'Wh', icon: '🔋', decimals: 4, gradient: 'from-green-400 to-emerald-500' },
          { label: 'Total Energy', value: kpis.totalEnergy, unit: 'Wh', icon: '🔋', decimals: 4, gradient: 'from-purple-400 to-pink-500' }
        ].map((kpi, index) => (
          <div key={index} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 lg:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center text-white text-lg shadow-md`}>
                {kpi.icon}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {kpi.label}
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:scale-105 transition-transform duration-200">
              {kpi.value !== null ? `${kpi.value.toFixed(kpi.decimals)}${kpi.unit}` : 'N/A'}
            </div>
          </div>
        ))}
      </div>

      {/* Metric Tabs */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <nav className="flex space-x-2 overflow-x-auto">
          {metrics.map(metric => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`py-3 px-4 lg:px-6 font-semibold text-sm lg:text-base whitespace-nowrap rounded-xl transition-all duration-300 ${
                activeMetric === metric
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              {METRIC_LABELS[metric]}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Metric Chart */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 lg:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
          <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
            {METRIC_LABELS[activeMetric]} Trend
          </h3>
          <button
            onClick={() => handleExportChart(activeMetric)}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            📥 Export PNG
          </button>
        </div>
        <div
          ref={el => chartRefs.current[activeMetric] = el}
          className="w-full h-80 lg:h-96"
        />
      </div>

      {/* All Metrics Grid (Hidden Charts for Export) */}
      <div className="hidden">
        {metrics.filter(m => m !== activeMetric).map(metric => (
          <div
            key={metric}
            ref={el => chartRefs.current[metric] = el}
            className="w-full h-80"
          />
        ))}
      </div>
    </div>
  )
}

export default ModelDetail
