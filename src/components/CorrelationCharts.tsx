import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { LongRow, ModelId } from '../types'
import { generateChartColors } from '../lib/palette'

interface CorrelationChartsProps {
  longData: LongRow[]
  models: ModelId[]
}

const CorrelationCharts: React.FC<CorrelationChartsProps> = ({
  longData,
  models
}) => {
  const qualityEnergyRef = useRef<HTMLDivElement>(null)
  const qualityCostRef = useRef<HTMLDivElement>(null)
  const latencySizeRef = useRef<HTMLDivElement>(null)
  
  const chartInstances = useRef<{
    qualityEnergy: echarts.ECharts | null
    qualityCost: echarts.ECharts | null
    latencySize: echarts.ECharts | null
  }>({
    qualityEnergy: null,
    qualityCost: null,
    latencySize: null
  })

  // Calculate model averages for correlation analysis
  const calculateModelAverages = () => {
    const modelData: Record<string, {
      quality: number | null
      energy: number | null
      latency: number | null
      cost: number | null
      size: number | null
    }> = {}

    // Model size mapping (in billions of parameters)
    const modelSizes: Record<string, number> = {
      'llama3.1_8b': 8,
      'gemma8b': 8,
      'mistralsmall': 22,
      'gptoss20b': 20,
      'gpt5': 175, // Estimated
      'deepseekr1': 67 // Estimated
    }

    // Cost mapping (estimated cost per 1M tokens in USD)
    const modelCosts: Record<string, number> = {
      'llama3.1_8b': 0.15,
      'gemma8b': 0.12,
      'mistralsmall': 0.25,
      'gptoss20b': 0.30,
      'gpt5': 2.50,
      'deepseekr1': 0.60
    }

    models.forEach(model => {
      const qualityValues = longData
        .filter(d => d.model === model && d.metric === 'quality')
        .map(d => d.value)
        .filter(v => v !== null && !isNaN(v))

      const energyValues = longData
        .filter(d => d.model === model && d.metric === 'energy_wh')
        .map(d => d.value)
        .filter(v => v !== null && !isNaN(v))

      const latencyValues = longData
        .filter(d => d.model === model && d.metric === 'latency_s')
        .map(d => d.value)
        .filter(v => v !== null && !isNaN(v))

      modelData[model] = {
        quality: qualityValues.length > 0 ? qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length : null,
        energy: energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : null,
        latency: latencyValues.length > 0 ? latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length : null,
        cost: modelCosts[model] || null,
        size: modelSizes[model] || null
      }
    })

    return modelData
  }

  useEffect(() => {
    if (!qualityEnergyRef.current || !qualityCostRef.current || !latencySizeRef.current) return

    const modelAverages = calculateModelAverages()
    const colors = generateChartColors(models.length)

    // Quality vs Energy Chart
    if (!chartInstances.current.qualityEnergy) {
      chartInstances.current.qualityEnergy = echarts.init(qualityEnergyRef.current)
    }

    const qualityEnergyData = models.map((model, index) => {
      const data = modelAverages[model]
      return {
        name: model,
        value: [data.energy, data.quality],
        itemStyle: { color: colors[index] }
      }
    }).filter(item => item.value[0] !== null && item.value[1] !== null)

    chartInstances.current.qualityEnergy.setOption({
      title: {
        text: 'Quality vs Energy Efficiency',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.data.name}<br/>Energy: ${params.data.value[0].toFixed(4)}Wh<br/>Quality: ${params.data.value[1].toFixed(2)}`
        }
      },
      xAxis: {
        type: 'value',
        name: 'Energy (Wh)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: '{value}' }
      },
      yAxis: {
        type: 'value',
        name: 'Quality Score',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { formatter: '{value}' }
      },
      series: [{
        type: 'scatter',
        data: qualityEnergyData,
        symbolSize: 60,
        label: {
          show: true,
          position: 'top',
          formatter: '{b}',
          fontSize: 10
        }
      }]
    })

    // Quality vs Cost Chart
    if (!chartInstances.current.qualityCost) {
      chartInstances.current.qualityCost = echarts.init(qualityCostRef.current)
    }

    const qualityCostData = models.map((model, index) => {
      const data = modelAverages[model]
      return {
        name: model,
        value: [data.cost, data.quality],
        itemStyle: { color: colors[index] }
      }
    }).filter(item => item.value[0] !== null && item.value[1] !== null)

    chartInstances.current.qualityCost.setOption({
      title: {
        text: 'Quality vs Cost Efficiency',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.data.name}<br/>Cost: $${params.data.value[0].toFixed(2)}/1M tokens<br/>Quality: ${params.data.value[1].toFixed(2)}`
        }
      },
      xAxis: {
        type: 'value',
        name: 'Cost ($/1M tokens)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: '${value}' }
      },
      yAxis: {
        type: 'value',
        name: 'Quality Score',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { formatter: '{value}' }
      },
      series: [{
        type: 'scatter',
        data: qualityCostData,
        symbolSize: 60,
        label: {
          show: true,
          position: 'top',
          formatter: '{b}',
          fontSize: 10
        }
      }]
    })

    // Latency vs Model Size Chart
    if (!chartInstances.current.latencySize) {
      chartInstances.current.latencySize = echarts.init(latencySizeRef.current)
    }

    const latencySizeData = models.map((model, index) => {
      const data = modelAverages[model]
      return {
        name: model,
        value: [data.size, data.latency],
        itemStyle: { color: colors[index] }
      }
    }).filter(item => item.value[0] !== null && item.value[1] !== null)

    chartInstances.current.latencySize.setOption({
      title: {
        text: 'Latency vs Model Size',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.data.name}<br/>Size: ${params.data.value[0]}B parameters<br/>Latency: ${params.data.value[1].toFixed(3)}s`
        }
      },
      xAxis: {
        type: 'value',
        name: 'Model Size (B parameters)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: '{value}B' }
      },
      yAxis: {
        type: 'value',
        name: 'Latency (seconds)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { formatter: '{value}s' }
      },
      series: [{
        type: 'scatter',
        data: latencySizeData,
        symbolSize: 60,
        label: {
          show: true,
          position: 'top',
          formatter: '{b}',
          fontSize: 10
        }
      }]
    })

    // Handle resize
    const handleResize = () => {
      chartInstances.current.qualityEnergy?.resize()
      chartInstances.current.qualityCost?.resize()
      chartInstances.current.latencySize?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [longData, models])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) {
          chart.dispose()
        }
      })
    }
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Model Correlation Analysis
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Quality vs Energy */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div ref={qualityEnergyRef} className="w-full h-80" />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
            Higher quality with lower energy is better (top-left quadrant)
          </p>
        </div>

        {/* Quality vs Cost */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div ref={qualityCostRef} className="w-full h-80" />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
            Higher quality with lower cost is better (top-left quadrant)
          </p>
        </div>

        {/* Latency vs Model Size */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div ref={latencySizeRef} className="w-full h-80" />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
            Shows relationship between model complexity and response time
          </p>
        </div>
      </div>
    </div>
  )
}

export default CorrelationCharts
