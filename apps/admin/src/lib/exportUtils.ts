/**
 * Export utilities for CSV/Excel export functionality
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>
): string {
  if (data.length === 0) return ''

  // CSV header
  const headers = columns.map(col => `"${col.label}"`).join(',')
  
  // CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      // Handle null/undefined
      if (value === null || value === undefined) return '""'
      // Handle objects/arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>,
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert data to Excel-compatible CSV (UTF-8 BOM for Excel)
 */
export function downloadExcel<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>,
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

