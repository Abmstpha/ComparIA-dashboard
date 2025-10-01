import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'
import { generateChartColors } from '../lib/palette'
import { exportChartAsPNG } from '../lib/export'

interface PromptBarChartProps {
  longData: LongRow[]
  models: ModelId[]
  selectedMetric: MetricName
  selectedPrompt: PromptId | 'ALL'
}

const PromptBarChart: React.FC<PromptBarChartProps> = ({
  longData,
  models,
  selectedMetric,
  selectedPrompt
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || models.length === 0) return

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    // If no specific prompt selected, show average across all prompts
    let data: number[]
    let title: string

    if (selectedPrompt === 'ALL') {
      // Calculate average for each model across all prompts
      data = models.map(model => {
        const modelData = longData.filter(d => d.model === model && d.metric === selectedMetric)
        if (modelData.length === 0) return 0
        
        const sum = modelData.reduce((acc, d) => acc + d.value, 0)
        return sum / modelData.length
      })
      title = `Average ${METRIC_LABELS[selectedMetric]} by Model`
    } else {
      // Show data for specific prompt
      data = models.map(model => {
        const dataPoint = longData.find(
          d => d.model === model && d.prompt === selectedPrompt && d.metric === selectedMetric
        )
        return dataPoint?.value ?? 0
      })
      title = `${METRIC_LABELS[selectedMetric]} for ${selectedPrompt}`
    }

    const colors = generateChartColors(models.length)

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          
          const param = params[0]
          const model = param.axisValue
          const value = param.value
          
          return `${model}<br/>${METRIC_LABELS[selectedMetric]}: ${value.toFixed(3)}`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: models,
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
      series: [{
        name: selectedMetric,
        type: 'bar',
        data: data.map((value, index) => ({
          value,
          itemStyle: {
            color: colors[index]
          }
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value.toFixed(3),
          fontSize: 10
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
  }, [longData, models, selectedMetric, selectedPrompt])

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
    exportChartAsPNG('prompt-bar-chart', `prompt_bar_${selectedMetric}.png`)
  }

  return (
    <div className="chart-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Model Comparison</h3>
        <button
          onClick={handleExport}
          className="btn-outline text-sm"
          title="Export as PNG"
        >
          📥 Export
        </button>
      </div>
      <div
        id="prompt-bar-chart"
        ref={chartRef}
        className="w-full h-80"
      />
    </div>
  )
}

export default PromptBarChart
