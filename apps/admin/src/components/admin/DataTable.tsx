'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  filterType?: 'text' | 'select' | 'date'
  filterOptions?: Array<{ label: string; value: string }>
}

interface DataTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  defaultSort,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSort?.direction || 'asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      result = result.filter((row) => {
        return columns.some((col) => {
          const value = getNestedValue(row, col.key)
          if (value == null) return false
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
      })
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '__all__') {
        result = result.filter((row) => {
          const rowValue = getNestedValue(row, key)
          if (rowValue == null) return false
          // Handle select filters (exact match) vs text filters (partial match)
          const col = columns.find(c => c.key === key)
          if (col?.filterType === 'select') {
            return String(rowValue).toLowerCase() === value.toLowerCase()
          }
          return String(rowValue).toLowerCase().includes(value.toLowerCase())
        })
      }
    })

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortKey)
        const bValue = getNestedValue(b, sortKey)

        // Handle null/undefined
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1

        // Handle different types
        let comparison = 0
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime()
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, searchQuery, filters, sortKey, sortDirection, columns])

  const filterableColumns = columns.filter((col) => col.filterable)

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {(searchable || filterableColumns.length > 0) && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
                />
              </div>
            )}

            {filterableColumns.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filterableColumns.map((col) => (
                  <div key={col.key} className="relative">
                    {col.filterType === 'select' && col.filterOptions ? (
                      <Select
                        value={filters[col.key] || '__all__'}
                        onValueChange={(value) =>
                          setFilters((prev) => {
                            const newFilters = { ...prev }
                            if (value === '__all__') {
                              delete newFilters[col.key]
                            } else {
                              newFilters[col.key] = value
                            }
                            return newFilters
                          })
                        }
                      >
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 h-10 rounded-xl text-sm border-gray-300/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 z-10 pointer-events-none" />
                          <SelectValue placeholder={`All ${col.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All {col.label}</SelectItem>
                          {col.filterOptions
                            .filter((option) => option.value !== '') // Filter out empty string values
                            .map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : col.filterType === 'date' ? (
                      <DatePicker
                        value={filters[col.key] || ''}
                        onChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            [col.key]: value,
                          }))
                        }
                        placeholder={`Filter by ${col.label}...`}
                        className="w-full"
                      />
                    ) : (
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 z-10 pointer-events-none" />
                        <input
                          type="text"
                          value={filters[col.key] || ''}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [col.key]: e.target.value,
                            }))
                          }
                          placeholder={`Filter by ${col.label}...`}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No results found
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 transition-all duration-200"
                >
                  {columns.map((col) => {
                    const value = getNestedValue(row, col.key)
                    return (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {col.render ? col.render(value, row) : String(value ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {filteredAndSortedData.length !== data.length && (
        <div className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/30 dark:from-gray-900/30 dark:to-gray-800/20">
          Showing {filteredAndSortedData.length} of {data.length} results
        </div>
      )}
    </div>
  )
}

