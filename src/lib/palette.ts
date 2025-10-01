export interface ColorScale {
  min: number
  max: number
  colors: string[]
}

export function createHeatmapColorScale(min: number, max: number): ColorScale {
  return {
    min,
    max,
    colors: [
      '#1e3a8a', // blue-900
      '#1e40af', // blue-800
      '#1d4ed8', // blue-700
      '#2563eb', // blue-600
      '#3b82f6', // blue-500
      '#60a5fa', // blue-400
      '#93c5fd', // blue-300
      '#bfdbfe', // blue-200
      '#dbeafe', // blue-100
      '#eff6ff', // blue-50
    ]
  }
}

export function getColorForValue(value: number, scale: ColorScale): string {
  if (isNaN(value) || !isFinite(value)) {
    return '#f3f4f6' // gray-100 for missing values
  }

  const { min, max, colors } = scale
  
  if (min === max) {
    return colors[Math.floor(colors.length / 2)]
  }

  const normalized = (value - min) / (max - min)
  const clampedNormalized = Math.max(0, Math.min(1, normalized))
  const colorIndex = Math.floor(clampedNormalized * (colors.length - 1))
  
  return colors[colorIndex]
}

export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
  ]

  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }

  return colors
}

export const DARK_MODE_COLORS = {
  background: '#1f2937', // gray-800
  surface: '#374151', // gray-700
  text: '#f9fafb', // gray-50
  textSecondary: '#d1d5db', // gray-300
  border: '#4b5563', // gray-600
}

export const LIGHT_MODE_COLORS = {
  background: '#ffffff',
  surface: '#f9fafb', // gray-50
  text: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb', // gray-200
}
