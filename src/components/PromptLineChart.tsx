import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'

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
    
    // Modern colors for line charts
    const modernColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

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
          color: modernColors[index % modernColors.length],
          width: 4,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 4,
          shadowOffsetY: 2
        },
        itemStyle: {
          color: modernColors[index % modernColors.length],
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 6
        },
        symbol: 'circle',
        symbolSize: 6,
        connectNulls: false
      }
    })

    const option: echarts.EChartsOption = {
      title: {
        text: `${METRIC_LABELS[selectedMetric]} Across Prompts`,
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 700,
          color: '#64748b'
        }
      },
      tooltip: {
        trigger: 'axis',
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
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: '#3b82f6',
            width: 1,
            type: 'dashed'
          },
          crossStyle: {
            color: '#3b82f6'
          }
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          
          const promptId = params[0]?.axisValue
          let tooltip = `<div style="font-weight: 600; margin-bottom: 8px; color: #3b82f6;">${promptId}</div>`
          
          params.forEach((param: any) => {
            if (param.value !== null) {
              tooltip += `<div style="margin-bottom: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span><span style="font-weight: 500;">${param.seriesName}:</span> <span style="font-weight: 600; color: #059669;">${param.value.toFixed(3)}</span></div>`
            }
          })
          
          return tooltip
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
        left: '8%',
        right: '8%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: prompts,
        axisLabel: {
          rotate: 45,
          fontSize: 11,
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
          formatter: (value: number) => value.toFixed(3)
        },
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
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return (
    <div ref={chartRef} className="w-full h-96" />
  )
}

export default PromptLineChart
