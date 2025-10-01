import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'
import { generateChartColors } from '../lib/palette'

interface PromptLineChartProps {
  longData: LongRow[]
  models: ModelId[]
  prompts: PromptId[]
  selectedMetric: MetricName
  selectedModel: ModelId | 'ALL'
}

const PromptLineChart: React.FC<PromptLineChartProps> = ({
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

    // Prepare series data - per-prompt performance lines
    const series = displayModels.map((model, index) => {
      const data = prompts.map(prompt => {
        const dataPoint = longData.find(
          d => d.model === model && d.prompt === prompt && d.metric === selectedMetric
        )
        return dataPoint?.value ?? null
      })

      return {
        name: model,
        type: 'line' as const,
        data,
        lineStyle: {
          color: colors[index],
          width: 2
        },
        itemStyle: {
          color: colors[index]
        },
        symbol: 'circle',
        symbolSize: 4,
        connectNulls: false
      }
    })

    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[selectedMetric]} Across Prompts`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          
          const promptId = params[0]?.axisValue
          let tooltip = `<strong>${promptId}</strong><br/>`
          
          params.forEach((param: any) => {
            if (param.value !== null) {
              tooltip += `${param.seriesName}: ${param.value.toFixed(3)}<br/>`
            }
          })
          
          return tooltip
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
        data: prompts,
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

  return (
    <div ref={chartRef} className="w-full h-80" />
  )
}

export default PromptLineChart
