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
    <div>
      {/* Search and Filters */}
      {(searchable || filterableColumns.length > 0) && (
        <div className="p-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
          <div className="flex flex-col gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
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
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 h-10 rounded-xl text-sm border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--foreground))]">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10 pointer-events-none" />
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
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] z-10 pointer-events-none" />
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
                          className="w-full pl-10 pr-4 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] text-sm placeholder:text-[hsl(var(--muted-foreground))]"
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
        <table className="w-full border-collapse">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-[hsl(var(--muted))]' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-[hsl(var(--muted-foreground))]">
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
          <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No results found
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
                >
                  {columns.map((col) => {
                    const value = getNestedValue(row, col.key)
                    return (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
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
        <div className="px-6 py-3 text-sm text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          Showing {filteredAndSortedData.length} of {data.length} results
        </div>
      )}
    </div>
  )
}

