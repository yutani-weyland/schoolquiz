'use client'

import { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableSkeleton } from './TableSkeleton'

interface DataTableProps {
  children: ReactNode
  className?: string
  emptyState?: {
    icon?: ReactNode
    message: string
  }
  isLoading?: boolean
}

export function DataTable({ 
  children, 
  className = '',
  emptyState,
  isLoading = false
}: DataTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />
  }

  if (emptyState && !children) {
    return (
      <Card className={cn('overflow-hidden p-0', className)}>
        <DataTableEmpty {...emptyState} />
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      {children}
    </Card>
  )
}

interface DataTableHeaderProps {
  children: ReactNode
  className?: string
}

export function DataTableHeader({ children, className = '' }: DataTableHeaderProps) {
  return (
    <thead className={cn('bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]', className)}>
      {children}
    </thead>
  )
}

interface DataTableHeaderCellProps {
  children: ReactNode
  className?: string
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
  column?: string // For compatibility, not used internally
}

export function DataTableHeaderCell({ 
  children, 
  className = '',
  sortable = false,
  sorted = false,
  onSort,
  column // Accept but don't use
}: DataTableHeaderCellProps) {
  const content = (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          sorted === 'asc' ? (
            <ArrowUp className="w-4 h-4" />
          ) : sorted === 'desc' ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )
        )}
      </div>
    </th>
  )

  return content
}

interface DataTableBodyProps {
  children: ReactNode
  className?: string
}

export function DataTableBody({ children, className = '' }: DataTableBodyProps) {
  return (
    <tbody className={cn('bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]', className)}>
      {children}
    </tbody>
  )
}

interface DataTableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function DataTableRow({ children, className = '', onClick }: DataTableRowProps) {
  return (
    <tr
      className={cn(
        'hover:bg-[hsl(var(--muted))] transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface DataTableCellProps {
  children: ReactNode
  className?: string
}

export function DataTableCell({ children, className = '' }: DataTableCellProps) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

interface DataTableEmptyProps {
  icon?: ReactNode
  message: string
}

export function DataTableEmpty({ icon, message }: DataTableEmptyProps) {
  return (
    <div className="p-12 text-center">
      {icon}
      <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
    </div>
  )
}

