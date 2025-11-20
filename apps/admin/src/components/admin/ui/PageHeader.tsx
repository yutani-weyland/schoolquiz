import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  metadata?: ReactNode
}

export function PageHeader({ 
  title, 
  description, 
  action,
  metadata 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </div>
      {(action || metadata) && (
        <div className="flex items-center gap-4">
          {metadata}
          {action}
        </div>
      )}
    </div>
  )
}

