import type { LongRow } from '../types'
import { calculateKpis } from '../lib/stats'

interface KpiCardsProps {
  data: LongRow[]
}

const KpiCards = ({ data }: KpiCardsProps) => {
  const kpis = calculateKpis(data)

  const formatValue = (value: number | null, unit: string = '', decimals: number = 3): string => {
    if (value === null) return 'N/A'
    return `${value.toFixed(decimals)}${unit}`
  }

  const kpiItems = [
    {
      label: 'Mean Quality',
      value: formatValue(kpis.meanQuality, '', 1),
      icon: '⭐',
      description: 'Average quality score'
    },
    {
      label: 'Mean Latency',
      value: formatValue(kpis.meanLatency, 's', 3),
      icon: '⚡',
      description: 'Average response time'
    },
    {
      label: 'Mean Energy',
      value: formatValue(kpis.meanEnergy, 'Wh', 4),
      icon: '🔋',
      description: 'Average energy per request'
    },
    {
      label: 'Total Energy',
      value: formatValue(kpis.totalEnergy, 'Wh', 4),
      icon: '🔋',
      description: 'Cumulative energy consumption'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpiItems.map((item, index) => (
        <div key={index} className="kpi-card">
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className="kpi-value">{item.value}</div>
          <div className="kpi-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default KpiCards
