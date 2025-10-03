import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'

interface ModelLineChartProps {
  longData: LongRow[]
  models: ModelId[]
  prompts: PromptId[]
  selectedMetric: MetricName
  selectedModel: ModelId | 'ALL'
}

const ModelLineChart: React.FC<ModelLineChartProps> = ({
  longData,
  models,
  prompts,
  selectedMetric,
  selectedModel
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || models.length === 0 || prompts.length === 0) return

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    // Filter models based on selection
    const displayModels = selectedModel === 'ALL' ? models : [selectedModel]
    
    // Modern gradient colors
    const modernColors = [
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }] },
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#7c3aed' }] },
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#059669' }] },
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#d97706' }] },
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#dc2626' }] },
      { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0891b2' }] }
    ]

    // Calculate model averages for the chart
    const modelAverages = displayModels.map(model => {
      const modelData = longData.filter(d => d.model === model && d.metric === selectedMetric)
      const values = modelData.map(d => d.value).filter(v => v !== null && !isNaN(v))
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
      return { model, average }
    })

    // Prepare series data - show model averages as a bar chart
    const series = [{
      name: METRIC_LABELS[selectedMetric],
      type: 'bar' as const,
      data: modelAverages.map((item, index) => ({
        value: item.average,
        name: item.model,
        itemStyle: {
          color: modernColors[index % modernColors.length],
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 8,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowOffsetY: 2
        }
      })),
      barWidth: '50%',
      label: {
        show: true,
        position: 'top' as const,
        formatter: (params: any) => params.value !== null ? Number(params.value).toFixed(2) : 'N/A'
      }
    }]

    // Compute tight y-axis bounds and a nice interval so bars aren't overly tall
    const validValues = modelAverages
      .map(m => m.average)
      .filter((v): v is number => v !== null && !isNaN(v))
    const dataMin = validValues.length ? Math.min(...validValues) : 0
    const dataMax = validValues.length ? Math.max(...validValues) : 1
    const rawRange = Math.max(1e-9, dataMax - dataMin)
    const padding = rawRange * 0.15
    const yMin = Math.max(0, dataMin - padding)
    const yMax = dataMax + padding

    // Choose a "nice" interval close to range/4
    const targetStep = rawRange / 4
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetStep || 1)))
    const mantissa = targetStep / magnitude
    let niceMantissa = 1
    if (mantissa <= 1) niceMantissa = 1
    else if (mantissa <= 2) niceMantissa = 2
    else if (mantissa <= 2.5) niceMantissa = 2.5
    else if (mantissa <= 5) niceMantissa = 5
    else niceMantissa = 10
    const interval = niceMantissa * magnitude

    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[selectedMetric]} by Model`,
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 700,
          color: '#9ca3af'
        }
      },
      tooltip: {
        trigger: 'item',
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
          const modelName = params.name
          const value = params.value
          return `<div style="font-weight: 600; margin-bottom: 6px; color: #3b82f6;">${modelName}</div><div style="font-weight: 600; color: #1e293b;">${METRIC_LABELS[selectedMetric]}: <span style="color: #059669;">${value !== null ? value.toFixed(3) : 'N/A'}</span></div>`
        }
      },
      legend: {
        top: '8%',
        type: 'plain',
        itemGap: 15,
        textStyle: {
          color: '#9ca3af'
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: displayModels,
        axisLabel: {
          rotate: 45,
          fontSize: 12,
          color: '#9ca3af',
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        axisTick: {
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: METRIC_LABELS[selectedMetric],
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 600
        },
        axisLabel: {
          fontSize: 11,
          color: '#9ca3af',
          fontWeight: 500,
          formatter: (value: number) => {
            const range = yMax - yMin
            return Number(value).toFixed(range < 3 ? 2 : 1)
          }
        },
        min: yMin,
        max: yMax,
        interval,
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            width: 1,
            type: 'dashed'
          }
        }
      },
      series
    }

    chart.setOption(option)

    // Handle resize
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [longData, models, prompts, selectedMetric, selectedModel])

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
      className="w-full h-80"
    />
  )
}

export default ModelLineChart
