import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'
import type { MatrixRow } from '../types'
import { exportTableAsCSV } from '../lib/export'

interface MatrixTableProps {
  data: MatrixRow[]
}

const MatrixTable: React.FC<MatrixTableProps> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const columnHelper = createColumnHelper<MatrixRow>()

  const columns = useMemo(() => {
    if (data.length === 0) return []

    // Get all unique prompt columns
    const allPrompts = new Set<string>()
    data.forEach(row => {
      Object.keys(row.values).forEach(prompt => allPrompts.add(prompt))
    })

    const promptColumns = Array.from(allPrompts).sort((a, b) => {
      // Sort prompts numerically if they follow p01, p02 pattern
      const aMatch = a.match(/^p(\d+)$/)
      const bMatch = b.match(/^p(\d+)$/)
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1])
      }
      
      return a.localeCompare(b)
    })

    return [
      columnHelper.accessor('metricLabel', {
        header: 'Metric',
        cell: info => info.getValue(),
        size: 200
      }),
      ...promptColumns.map(prompt =>
        columnHelper.accessor(
          row => row.values[prompt],
          {
            id: prompt,
            header: prompt,
            cell: info => {
              const value = info.getValue()
              return value !== null && value !== undefined 
                ? typeof value === 'number' ? value.toFixed(4) : String(value)
                : '-'
            },
            size: 100
          }
        )
      )
    ]
  }, [data, columnHelper])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleExport = () => {
    const exportData = data.map(row => ({
      metric: row.metricLabel,
      ...row.values
    }))
    exportTableAsCSV(exportData, 'matrix_data.csv')
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Matrix View</h3>
        <button
          onClick={handleExport}
          className="btn-outline text-sm"
          title="Export as CSV"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="overflow-auto max-h-96 scrollbar-thin">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </span>
                      <span className="text-gray-400">
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted() as string] ?? '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {table.getRowModel().rows.length} of {data.length} rows
      </div>
    </div>
  )
}

export default MatrixTable
