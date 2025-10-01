import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'
import { getMetricValues, getMinMax } from '../lib/stats'

interface HeatmapProps {
  longData: LongRow[]
  models: ModelId[]
  prompts: PromptId[]
  selectedMetric: MetricName
}

const Heatmap = ({ longData, models, prompts, selectedMetric }: HeatmapProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || models.length === 0 || prompts.length === 0) return

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    // Get data for heatmap
    const values = getMetricValues(longData, selectedMetric, models, prompts)
    const { min: dataMin, max: dataMax } = getMinMax(values)
    
    // Use fixed scale for quality metrics (0-5), dynamic scale for others
    const min = selectedMetric === 'quality' ? 0 : dataMin
    const max = selectedMetric === 'quality' ? 5 : dataMax

    // Prepare data for ECharts
    const data: Array<[number, number, number]> = []
    for (let i = 0; i < models.length; i++) {
      for (let j = 0; j < prompts.length; j++) {
        const value = values[i][j]
        if (!isNaN(value)) {
          data.push([j, i, value])
        }
      }
    }

    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[selectedMetric]} Heatmap`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 700,
          color: '#1e293b'
        }
      },
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        textStyle: {
          color: '#1e293b',
          fontSize: 13,
          fontWeight: 500
        },
        extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); backdrop-filter: blur(8px);',
        formatter: (params: any) => {
          const [promptIdx, modelIdx, value] = params.data
          const model = models[modelIdx]
          const prompt = prompts[promptIdx]
          return `<div style="font-weight: 600; margin-bottom: 6px; color: #3b82f6;">${model}</div><div style="margin-bottom: 4px; color: #64748b;">${prompt}</div><div style="font-weight: 600; color: #1e293b;">${METRIC_LABELS[selectedMetric]}: <span style="color: #059669;">${value.toFixed(3)}</span></div>`
        }
      },
      grid: {
        height: '70%',
        top: '15%',
        left: '15%',
        right: '15%'
      },
      xAxis: {
        type: 'category',
        data: prompts,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.8)']
          }
        },
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#64748b',
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        }
      },
      yAxis: {
        type: 'category',
        data: models,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.8)']
          }
        },
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        }
      },
      visualMap: {
        min,
        max,
        calculable: true,
        orient: 'vertical',
        right: '3%',
        top: 'center',
        inRange: {
          color: [
            '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe',
            '#fef3c7', '#fcd34d', '#f59e0b', '#d97706', '#b45309', '#92400e'
          ]
        },
        text: ['High', 'Low'],
        textStyle: {
          fontSize: 12,
          color: '#374151',
          fontWeight: 600
        }
      },
      series: [{
        name: selectedMetric,
        type: 'heatmap',
        data,
        label: {
          show: false
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 4
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(59, 130, 246, 0.4)',
            borderColor: '#3b82f6',
            borderWidth: 3,
            borderRadius: 6
          }
        }
      }]
    }

    chart.setOption(option)

    // Handle resize
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [longData, models, prompts, selectedMetric])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current = null
      }
    }
  }, [])

  return (
    <div
      ref={chartRef}
      className="w-full h-96"
    />
  )
}

export default Heatmap
