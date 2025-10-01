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
      description: 'Average quality score',
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      iconBg: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Mean Latency',
      value: formatValue(kpis.meanLatency, 's', 3),
      icon: '⚡',
      description: 'Average response time',
      gradient: 'from-blue-400 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      iconBg: 'from-blue-500 to-cyan-600'
    },
    {
      label: 'Mean Energy',
      value: formatValue(kpis.meanEnergy, 'Wh', 4),
      icon: '🔋',
      description: 'Average energy per request',
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      iconBg: 'from-emerald-500 to-green-600'
    },
    {
      label: 'Total Energy',
      value: formatValue(kpis.totalEnergy, 'Wh', 4),
      icon: '🔋',
      description: 'Cumulative energy consumption',
      gradient: 'from-purple-400 via-violet-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      iconBg: 'from-purple-500 to-violet-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiItems.map((item, index) => (
        <div 
          key={index} 
          className={`group relative overflow-hidden bg-gradient-to-br ${item.bgGradient} p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 cursor-pointer`}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white to-transparent rounded-full transform -translate-x-6 translate-y-6"></div>
          </div>
          
          {/* Floating Icon */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${item.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <span className="text-2xl filter drop-shadow-sm">{item.icon}</span>
            </div>
            <div className="w-2 h-2 bg-gradient-to-r from-white/40 to-white/20 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
          </div>
          
          {/* Value with Gradient Text */}
          <div className="relative z-10 mb-2">
            <div className={`text-2xl lg:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
              {item.value}
            </div>
          </div>
          
          {/* Label and Description */}
          <div className="relative z-10">
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300">
              {item.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              {item.description}
            </div>
          </div>
          
          {/* Hover Glow Effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
        </div>
      ))}
    </div>
  )
}

export default KpiCards
