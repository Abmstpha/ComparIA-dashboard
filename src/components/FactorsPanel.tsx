import React from 'react'
import type { Factors } from '../types'

interface FactorsPanelProps {
  factors: Factors
  overrideWithDerived: boolean
  onFactorsChange: (factors: Factors) => void
  onOverrideToggle: (override: boolean) => void
}

const FactorsPanel: React.FC<FactorsPanelProps> = ({
  factors,
  overrideWithDerived,
  onFactorsChange,
  onOverrideToggle
}) => {
  const handleFactorChange = (key: keyof Factors, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      onFactorsChange({
        ...factors,
        [key]: numValue
      })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="section-header">Conversion Factors</h3>
      
      <div className="space-y-3">
        <div>
          <label className="label">LED Bulb Watts</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={factors.ledBulbWatts}
            onChange={(e) => handleFactorChange('ledBulbWatts', e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Power consumption of LED bulb (W)
          </p>
        </div>

        <div>
          <label className="label">Grid Intensity</label>
          <input
            type="number"
            min="1"
            step="1"
            value={factors.gridIntensityGCO2PerKwh}
            onChange={(e) => handleFactorChange('gridIntensityGCO2PerKwh', e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Grid carbon intensity (gCO₂/kWh)
          </p>
        </div>

        <div>
          <label className="label">Online Video Energy</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={factors.onlineVideoWhPerMin}
            onChange={(e) => handleFactorChange('onlineVideoWhPerMin', e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Energy per minute of video (Wh/min)
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={overrideWithDerived}
            onChange={(e) => onOverrideToggle(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Override with derived metrics
          </span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Use calculated values even when CSV provides them
        </p>
      </div>
    </div>
  )
}

export default FactorsPanel
