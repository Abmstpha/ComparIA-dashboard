import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, MetricName, ModelId, PromptId } from '../types'
import { METRIC_LABELS } from '../types'
import { getMetricValues, getMinMax } from '../lib/stats'
import { exportChartAsPNG } from '../lib/export'

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
    const { min, max } = getMinMax(values)

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
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [promptIdx, modelIdx, value] = params.data
          const model = models[modelIdx]
          const prompt = prompts[promptIdx]
          return `${model}<br/>${prompt}<br/>${METRIC_LABELS[selectedMetric]}: ${value.toFixed(3)}`
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
          show: true
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'category',
        data: models,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 10
        }
      },
      visualMap: {
        min,
        max,
        calculable: true,
        orient: 'vertical',
        right: '2%',
        top: 'center',
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        text: ['High', 'Low'],
        textStyle: {
          fontSize: 10
        }
      },
      series: [{
        name: selectedMetric,
        type: 'heatmap',
        data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
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
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  const handleExport = () => {
    exportChartAsPNG('heatmap-chart', `heatmap_${selectedMetric}.png`)
  }

  return (
    <div className="chart-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Heatmap</h3>
        <button
          onClick={handleExport}
          className="btn-outline text-sm"
          title="Export as PNG"
        >
          📥 Export
        </button>
      </div>
      <div
        id="heatmap-chart"
        ref={chartRef}
        className="w-full h-80"
      />
    </div>
  )
}

export default Heatmap
