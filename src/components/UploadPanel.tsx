import React, { useRef, useState } from 'react'
import { downloadSampleCSV } from '../lib/export'

interface UploadPanelProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
  error: string | null
}

const UploadPanel: React.FC<UploadPanelProps> = ({ onFileUpload, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return
    }
    onFileUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'))
    
    if (csvFile) {
      handleFileSelect(csvFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="section-header">Data Upload</h3>
      
      <div
        className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="loading-spinner mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Drop CSV file here or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              CSV files only
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={downloadSampleCSV}
          className="btn-outline w-full text-sm"
          disabled={isLoading}
        >
          📥 Download Sample CSV
        </button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>CSV Format:</strong></p>
          <p>• First column: "metric"</p>
          <p>• Other columns: "p01", "p02", etc.</p>
          <p>• Rows: "model_metric" format</p>
          <p>• Example: "gpt4o_quality"</p>
        </div>
      </div>
    </div>
  )
}

export default UploadPanel
