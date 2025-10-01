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
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0]
          const value = point.value
          return `${point.axisValue}<br/>${METRIC_LABELS[metric]}: ${
            value !== null ? `${value}${METRIC_UNITS[metric]}` : 'N/A'
          }`
        }
      },
      xAxis: {
        type: 'category',
        data: prompts,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: METRIC_LABELS[metric],
        nameTextStyle: {
          fontSize: 11
        },
        axisLabel: {
          fontSize: 10,
          formatter: (value: number) => `${value}${METRIC_UNITS[metric]}`
        }
      },
      series: [{
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#3b82f6'
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.3)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.05)'
            }]
          }
        },
        connectNulls: false
      }],
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '15%'
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
    <div className="space-y-6">
      {/* Model Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
          {modelId} - Detailed Analysis
        </h2>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          Performance metrics across {prompts.length} prompts
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Quality', value: kpis.meanQuality, unit: '', icon: '⭐', decimals: 1 },
          { label: 'Avg Latency', value: kpis.meanLatency, unit: 's', icon: '⚡', decimals: 3 },
          { label: 'Avg Energy', value: kpis.meanEnergy, unit: 'Wh', icon: '🔋', decimals: 4 },
          { label: 'Total Energy', value: kpis.totalEnergy, unit: 'Wh', icon: '🔋', decimals: 4 }
        ].map((kpi, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {kpi.label}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {kpi.value !== null ? `${kpi.value.toFixed(kpi.decimals)}${kpi.unit}` : 'N/A'}
            </div>
          </div>
        ))}
      </div>

      {/* Metric Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {metrics.map(metric => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeMetric === metric
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {METRIC_LABELS[metric]}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Metric Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {METRIC_LABELS[activeMetric]} Trend
          </h3>
          <button
            onClick={() => handleExportChart(activeMetric)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
          >
            Export PNG
          </button>
        </div>
        <div
          ref={el => chartRefs.current[activeMetric] = el}
          className="w-full h-80"
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
