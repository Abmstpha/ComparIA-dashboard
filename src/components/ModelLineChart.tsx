import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'
import { generateChartColors } from '../lib/palette'
import { exportChartAsPNG } from '../lib/export'

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
    const colors = generateChartColors(displayModels.length)

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
          color: colors[index % colors.length]
        }
      })),
      barWidth: '60%',
      label: {
        show: true,
        position: 'top' as const,
        formatter: (params: any) => params.value !== null ? params.value.toFixed(3) : 'N/A'
      }
    }]

    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[selectedMetric]} by Model`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const modelName = params.name
          const value = params.value
          return `<strong>${modelName}</strong><br/>${METRIC_LABELS[selectedMetric]}: ${value !== null ? value.toFixed(3) : 'N/A'}`
        }
      },
      legend: {
        top: '8%',
        type: 'scroll'
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
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: METRIC_LABELS[selectedMetric],
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: (value: number) => value.toFixed(3)
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
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  const handleExport = () => {
    exportChartAsPNG('model-line-chart', `model_line_${selectedMetric}.png`)
  }

  return (
    <div className="chart-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Model Performance</h3>
        <button
          onClick={handleExport}
          className="btn-outline text-sm"
          title="Export as PNG"
        >
          📥 Export
        </button>
      </div>
      <div
        id="model-line-chart"
        ref={chartRef}
        className="w-full h-80"
      />
    </div>
  )
}

export default ModelLineChart
